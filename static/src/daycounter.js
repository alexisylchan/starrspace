(function(global) {
    var DayCounter = function() {
        var currDate = new Date();
        this.styled_dates = Object.keys(styleRepo); // Dates which haved had their style precomputed
        this.styled_index = 0;
        this.year = currDate.getFullYear();
        this.month = currDate.getMonth();
        this.day = currDate.getDate();
        this.out_of_dates = false;
    }

    DayCounter.prototype = {
        get_month: function() {
            // returns valid month                
            return this.month;
        },
        get_day: function() {
            // returns valid day
            return this.day;
        },
        get_year: function() {
            // returns valid year
            // 1995 to 2017
            return this.year;
        },
        get_month_str: function() {
            // returns valid month string
            var str = '' + this.month;
            if (str.length < 2) {
                return '0' + str;
            }
            return str;
        },
        get_day_str: function() {
            // returns valid day string
            var str = '' + this.day;
            if (str.length < 2) {
                return '0' + str;
            }
            return str;
        },
        get_year_str: function() {
            // returns valid year
            // 1995 to 2017
            return '' + this.year;
        },
        get_date: function() {
            if (this.out_of_dates) {
                return null;
            }
            return this.get_year_str() + '-' + this.get_month_str() + '-' + this.get_day_str();
        },
        get_next_date: function () {

            if (Math.random() >= 0.4  && this.styled_index < this.styled_dates.length) { // Randomly include styled image 60% of the time
                next_date = this.styled_dates[this.styled_index];
                ++this.styled_index;
                return next_date;
            } else {
                while (!this.out_of_dates) {
                    this.next();
                    next_date = this.get_date();
                    if (!this.styled_dates.hasOwnProperty(next_date)) {
                        return next_date;
                    }
                }
            }
            return null;
        },
        next: function() {
            if (this.out_of_dates) {
                // Early exit if out of dates
                return;
            }

            // Move to the next valid date
            --this.day;
            if (this.day < 1) {
                --this.month;
                if (this.month < 1) {
                    // Get previous year
                    --this.year;
                    if (this.year < 1995) {
                        // stop getting next
                        this.out_of_dates = true;
                        return;
                    }
                    this.month = 12; // set to last month of previous year
                }
                // Get last day of month
                switch (this.month) {
                    case 1:
                    case 3:
                    case 5:
                    case 7:
                    case 8:
                    case 10:
                    case 12:
                        this.day = 31;
                        break;
                    case 2:
                        this.day = ((this.year % 4) === 0) ? 29 : 28;
                        break;
                    default:
                        this.day = 30;
                }
            }
        }
    }
    global.DayCounter = DayCounter;
})(window);