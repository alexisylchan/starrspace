#!/usr/bin/env python
"""
 *****************************************************
 *
 *              Alexis Chan
 * Email:       alexis.cyl@gmail.com
 * LinkedIn:    www.linkedin.com/in/alexisylchan
 * Github:      https://github.com/alexisylchan
 *
 *****************************************************/
"""

import json, os, urllib, re, glob, config, uuid
import evaluate as faststyle
import pyclamd
from flask import Flask, request, jsonify, send_from_directory, make_response, session
from PIL import Image, ImageEnhance
from itsdangerous import Signer
from pymongo import MongoClient

app = Flask(__name__, static_url_path="/static")
app.debug = False
app.config.from_object(config)
app.signer = Signer(os.urandom(24).encode('hex'))
app.mongod = MongoClient('mongodb://localhost:27017/')
app.scanner = pyclamd.ClamdAgnostic()
if not app.scanner.ping():
    raise Exception('Start ClamAV Daemon') 

def gen_client_id():
    return os.urandom(24).encode('hex')

def get_session_id(client_id):
    session[client_id] = app.signer.sign(client_id) # seralizer
    if app.signer.unsign(session[client_id]) != client_id:
        print app.signer.unsign(session[client_id]) 
        print client_id  
        return None
    return session[client_id]

def get_client_dir(client_id):
    client_dir = '/tmp/'
    sessionID = get_session_id(client_id)    
    if sessionID is not None:
        client_dir = client_dir + sessionID +'/'

    if not os.path.exists(client_dir):
        try:
            os.makedirs(client_dir)
        except Exception as ex:
            return '/tmp/'
    return client_dir

def get_result_dir(client_id):
    client_dir = get_client_dir(client_id)
    result_dir = client_dir + 'results/'
    if not os.path.exists(result_dir):
        os.makedirs(result_dir)
    return result_dir

@app.route("/")
def get_index():
    if app.debug:
        return send_from_directory("static", "index.html")
    else:
        return send_from_directory("static/build/", "index.html")

@app.route("/robots.txt")
def get_robots():
    return send_from_directory("static", "robots.txt")

@app.route("/static/<path:path>/<file>")
def prevent_access(path, file):
    return make_response('Invalid access')

@app.route("/privacy")
def get_privacy():
    return app.send_static_file("privacy.html")


@app.route("/terms")
def get_terms():
    return app.send_static_file("terms_and_conditions.html")

@app.route("/src/<source_file>")
def get_src(source_file):
    if app.debug:
        return send_from_directory("static/src/", source_file)
    else:
        return send_from_directory("static/build/src/", source_file)

@app.route("/css/<css_file>")
def get_css(css_file):
    return send_from_directory("static/css/", css_file)

@app.route("/thirdparty/<source_file>")
def get_thirdparty(source_file):
    return send_from_directory("static/thirdparty/", source_file)


def preprocess_img(filename):
    img = Image.open(filename, mode='r')
    col = ImageEnhance.Color(img)
    img2  = col.enhance(1.5)  
    con= ImageEnhance.Contrast(img2)
    img3 = con.enhance(3)
    img3.save(filename)

def postprocess_img(filename):
    img = Image.open(filename, mode='r')
    contrast = ImageEnhance.Contrast(img)
    img2  = contrast.enhance(1.5)
    img2.save(filename)

@app.route("/results/<imgfile>")
def get_results(imgfile):
    if 'client_id' in request.cookies: 
        client_id = request.cookies['client_id']
        result_dir = get_result_dir(client_id) 
        if os.path.exists(result_dir + imgfile): 
            resp = make_response(send_from_directory(result_dir, imgfile))
            resp.set_cookie('client_id', value=client_id, max_age=5000)
            return resp
    return jsonify(error = "An unexpected error has occurred" )


@app.route("/images/<imgfile>")
def get_images(imgfile):
    return send_from_directory("static/images", imgfile)    

@app.route("/nominate", methods=['POST'])
def nominate_style(): 
    imgSrc= request.values.get('imgSrc')
    date = request.values.get('date')
    # query for date
    db = app.mongod.nominateDB # db
    noms = db.nominations # collection
    noms.update_one(
        {'date': date}, 
        { 
            '$setOnInsert': 
                {'date': date, 'url': imgSrc },
            '$inc': {'count': 1}
        }, 
        True)
    currEntry = noms.find_one({'date':date})
    if currEntry is not None:
        return jsonify(numNoms = currEntry['count'])
    return jsonify(error = "An unexpected error has occurred" )

@app.route("/style")
def get_styled(): 
    if 'client_id' in request.cookies: 
        client_id = request.cookies['client_id']
        client_dir = get_client_dir(client_id)
        result_dir = get_result_dir(client_id)
    
        base_file = client_dir +'test.png'
        style_file = 'static/images/style.png'
        result_suffix = str(uuid.uuid1()) + '.png'

        # Get style image prefix
        try:
            style_file = request.args.get('image', '')
            if len(style_file) > 0:                     
                slen = len(style_file)
                style_prefix = style_file[0:slen-5]
                print style_prefix
                result_path = result_dir + style_prefix + result_suffix
            else:
                return jsonify(error =True, exception= "Invalid request")   
        except Exception as ex: 
            print ex
            return jsonify(error=True, exception="Invalid request")
        relative_style_file = 'static/nasackpt/' + style_file

        # Construct unique result image name
        while os.path.exists(result_path):
            result_suffix = str(uuid.uuid1()) + '.png'
            result_path = result_dir + style_prefix + result       

        # Apply fast style transfer 
        if os.path.exists(relative_style_file):
            preprocess_img(base_file)
            faststyle.ffwd_to_img(base_file, result_path, relative_style_file)
            postprocess_img(result_path)
            os.remove(base_file)
            resp = make_response(jsonify(root= "/results", filename= style_prefix + result_suffix ))
            resp.set_cookie('client_id', value=client_id, max_age=5000)
            return resp

    # Unexpected error
    return jsonify(error = "An unexpected error has occurred" )

@app.route("/deletetmp", methods=['POST'])
def delete_image():
    if 'client_id' in request.cookies: 
        client_id = request.cookies['client_id']
        # Delete uploaded file
        client_dir = get_client_dir(client_id)
        client_uploaded = client_dir + 'test.png'
        if os.path.exists(client_uploaded):
            os.remove(client_uploaded) 

        # Delete result files
        cwd = os.getcwd()
        result_dir = get_result_dir(client_id)
        if os.path.exists(result_dir):
            os.chdir(result_dir)
            filelist = glob.glob("*")
            for f in filelist:
                os.remove(f)
            os.removedirs(result_dir)
            os.chdir(cwd)
            resp = make_response('Delete cookie')    
            resp.set_cookie('client_id', expires=0) # Delete cookie        
            return resp
    return 'Failed to delete data'

@app.route("/upload", methods=['POST'])
def save_image():
    client_id = gen_client_id()
    client_dir = get_client_dir(client_id)
    uploaded_img = request.files['blob']
    filename = client_dir +'test.png'
    try: 
        uploaded_img.save(filename)
        scan_result = app.scanner.scan_file(filename)
        if scan_result is not None:
            os.remove(filename) # Delete offending file
            errstr = 'Found virus: '+ scan_result[filename]
            print(errstr)
            raise Exception(errstr)
        # Resize to max-size : 1000 px to prevent memalloc issue on Google Compute Engine
        pilImage = Image.open(filename)
        ratio = min(1000./pilImage.width, 1000./pilImage.height)
        pilImage = pilImage.resize((int(pilImage.width*ratio),int(pilImage.height*ratio)),Image.ANTIALIAS)
        pilImage.save(filename)
        resp = make_response('SUCCESS')
        resp.set_cookie('client_id', value=client_id, max_age=5000)
        return resp
    except Exception as ex:
        return jsonify(error = "Error uploading image!" )

if __name__ == "__main__":
    #app.run(port=8080)
    reactor_args = {}
    
    def run_twisted_wsgi():
        from twisted.internet import reactor
        from twisted.web.server import Site
        from twisted.web.wsgi import WSGIResource

        resource = WSGIResource(reactor, reactor.getThreadPool(), app)
        site = Site(resource)
        reactor.listenTCP(80, site)
        reactor.run(**reactor_args)
        
    if app.debug:
        # Disable twisted signal handlers in development only.
        reactor_args['installSignalHandlers'] = 0
        # Turn on auto reload.
        import werkzeug.serving
        run_twisted_wsgi = werkzeug.serving.run_with_reloader(run_twisted_wsgi)

    run_twisted_wsgi()