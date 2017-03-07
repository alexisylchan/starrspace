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

import json, os, urllib, re, glob

import evaluate as faststyle

from flask import Flask, request, jsonify, send_from_directory

#from bottle import get, run, request, response, route, static_file
from PIL import Image, ImageEnhance
import config

from tinydb import TinyDB, where, Query
from tinydb.operations import increment
import uuid

debug = False
app = Flask(__name__, static_url_path="/static")
app.config.from_object(config)

@app.route("/")
def get_index():
    if debug:
        return send_from_directory("static", "index.html")
    else:
        return send_from_directory("static/build/", "index.html")

@app.route("/privacy")
def get_privacy():
    return app.send_static_file("privacy.html")

@app.route("/src/<source_file>")
def get_src(source_file):
    if debug:
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
    img = Image.open(filename)
    col = ImageEnhance.Color(img)
    img2  = col.enhance(1.5)  
    con= ImageEnhance.Contrast(img2)
    img3 = con.enhance(3)
    img3.save(filename)

def postprocess_img(filename):
    img = Image.open(filename)
    contrast = ImageEnhance.Contrast(img)
    img2  = contrast.enhance(1.5)
    img2.save(filename)

@app.route("/results/<imgfile>")
def get_results(imgfile):
    return send_from_directory("static/results", imgfile)


@app.route("/images/<imgfile>")
def get_images(imgfile):
    return send_from_directory("static/images", imgfile)    

@app.route("/fakeStyle")
def get_fakestyle():
    base_file = 'static/images/test.png'
    style_file = 'static/images/style.png'
    result_path = 'static/results/'
    result_suffix = str(uuid.uuid1()) + '.png'
    try: 
        style_img = request.args.get('image', '')
        if len(style_img) > 0:                     
            style_file = 'static/'+ style_img
            slen = len(style_img)
            style_prefix = style_img[8:slen-4]
            print style_prefix
            result_path = result_path + style_prefix + result_suffix
            print result_path
        else:
            return jsonify(error =True, exception= "Invalid request")   
        
    except Exception as ex: 
        print ex
        return jsonify(error=True, exception= ex)
    return jsonify(root= "/results", filename= result_suffix )

@app.route("/nominate", methods=['POST'])
def nominate_style(): 
    imgSrc= request.values.get('imgSrc')
    date = request.values.get('date')
    # query for date
    db = TinyDB('db.json');
    query = Query()
    entries = db.search(query['date']== date)
    if (len(entries) > 0):
        print len(entries)
        db.update(increment('count'), query['date']== date)
    else:
        db.insert_multiple([{'date':date, 'count':1, 'url': imgSrc}])
    newEntries = db.search(query['date']== date)

    count = 1
    for entry in newEntries:
        print entry['count']
        count = entry['count']

    db.close()
    return jsonify(numNoms = count)

@app.route("/style")
def get_styled():    
    base_file = 'static/images/test.png'
    style_file = 'static/images/style.png'
    result_prefix = 'static/results/'
    result_suffix = str(uuid.uuid1()) + '.png'
    try:
        style_file = request.args.get('image', '')
        if len(style_file) > 0:                     
            slen = len(style_file)
            style_prefix = style_file[0:slen-5]
            print style_prefix
            result_path = result_prefix + style_prefix + result_suffix
        else:
            return jsonify(error =True, exception= "Invalid request")   
    except Exception as ex: 
        print ex
        return jsonify(error=True, exception= ex)

    relative_style_file = 'static/nasackpt/' + style_file
    while os.path.exists(result_path):
        result_suffix = str(uuid.uuid1()) + '.png'
        result_path = result_prefix + style_prefix + result_suffix 
 
    if os.path.exists(relative_style_file):
        preprocess_img(base_file)
        faststyle.ffwd_to_img(base_file, result_path, relative_style_file)
        postprocess_img(result_path)
        os.remove(base_file)
        return jsonify(root= "/results", filename= style_prefix + result_suffix )
    else:
        return jsonify(error = "File not found" )


@app.route("/deletetmp", methods=['POST'])
def delete_image():
    filename = 'static/images/test.png'
    if os.path.exists(filename):
        os.remove(filename)

    os.chdir('static/results/')
    filelist = glob.glob("*")
    for f in filelist:
        os.remove(f)
    os.chdir('../../')

    return 'success'

@app.route("/upload", methods=['POST'])
def save_image():
    uploaded_img = request.files['blob'];
    filename = 'static/images/test.png'; # TODO: send file name
    uploaded_img.save(filename);
    # Resize to max-size : 1000 px to prevent memalloc issue on Google Compute Engine
    pilImage = Image.open(filename)
    ratio = min(1000./pilImage.width, 1000./pilImage.height)
    pilImage = pilImage.resize((int(pilImage.width*ratio),int(pilImage.height*ratio)),Image.ANTIALIAS)
    pilImage.save(filename)

    return 'SUCCESS'

if __name__ == "__main__":
    app.run(port=8080)
