/* 
    Implement Twitter/Weibo @ mentions

    Copyright (C) 2012 chord.luo@gmail.com

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function($) {
    At = {
        cache : {},
        settings: {},
        $inputor : null,
        lenght : 0,
        pos: 0,
        offset: function() {
            $inputor = this.$inputor;
            Mirror = function($origin) {
                this.init($origin);
            }
            Mirror.prototype = {
                $mirror: null,
                css : ["overflowY", "height", "width", "paddingTop", "paddingLeft", "paddingRight", "paddingBottom", "marginTop", "marginLeft", "marginRight", "marginBottom",'fontFamily', 'borderStyle', 'borderWidth', 'wordWrap', 'fontSize', 'lineHeight', 'overflowX'],
                init: function($origin) {
                    $mirror =  $('<div></div>');
                    var css = {
                        opacity: 0, 
                        position: 'absolute', 
                        left: 0,
                        top:0, 
                        zIndex: -20000
                    }
                    $.each(this.css,function(i,p){
                        css[p] = $origin.css(p);
                    });
                    $mirror.css(css);
                    $('body').append($mirror);
                    this.$mirror = $mirror;
                },
                setContent: function(html) {
                    this.$mirror.html(html);
                },
                getFlagPos:function() {
                    return this.$mirror.find("span#flag").position();
                }
            };
            mirror = $inputor.data("mirror");
            if (mirror == undefined) {
                mirror = new Mirror($inputor);
                $inputor.data("mirror",mirror);
            }
            start_range = $inputor.val().slice(0,this.pos);
            end_range = $inputor.val().slice(this.pos);
            html = "<span>"+start_range+"</span>";
            html += "<span id='flag'>"+end_range+"</span>";
            mirror.setContent(html);

            offset = $inputor.offset();
            at_offset = mirror.getFlagPos();
            line_height = $inputor.css("line-height");
            line_height = isNaN(line_height) ? 20 : line_height;
            y = offset.top + at_offset.top + line_height - $(window).scrollTop();
            x = offset.left + at_offset.left;

            return {'top':y,'left':x};
        },
        getKey: function() {
            $inputor = this.$inputor;
            text = $inputor.val()
            caret_pos = $inputor.caretPos();

            subtext = text.slice(0,caret_pos);
            word = subtext.match(/@\w+$|@[^\x00-\xff]+$/);
            key = null;
            if (word) {
                word = word.join("").slice(1);
                start = caret_pos - word.length;
                end = start + word.length;
                this.pos = start - 1;
                key = {'text':word, 'start':start, 'end':end};
            } else
                this.view.hide();
            this.cache['key'] = key;
            return key;
        },
        replaceStr: function(str) {
            /* $inputor.replaceStr(str,start,end)*/
            key = this.cache['key'];
            source = this.$inputor.val();
            start_str = source.slice(0, key.start);
            text = start_str + str + source.slice(key.end);
            $inputor.val(text);
            this.$inputor.caretPos(start_str.length + str.length);
        },
        choose: function($li) {
            this.replaceStr($li.text()+" ");
            this.view.hide();
        },
        init: function(options) {
            this.settings = $.extend({
                'url':"#",
                'param':{},
                'key_name':"keyword"
            },options);
        },
        run: function($inputor) {
            this.$inputor = $inputor;
            key = this.getKey();
            if (!key) return;

            url = this.settings['url'];
            params = this.settings['param'];
            params[this.settings['key_name']] = key.text;

            $.ajax(url,params,function(data){
                data = $.parseJSON(data);
                if ($.isArray(data))
                    At.view.load(data);
            });
        },
        test: function($inputor) {
            this.$inputor = $inputor;
            key = this.getKey();
            if (!key) return;

            url = this.settings['url'];
            params = this.settings['param'];
            params[this.settings['key_name']] = key.text;

            console.log(params);
            data = {
                'a':['asee','asabc','asthree'],
                'b':['bone','btwo','bthreeeeeeeeee'],
                'c':['cone','ctwo','cthreeeeeeeeee'],
                'd':['done','dtwo','dthreeeeeeeeee'],
                'e':['eone','etwo','ethreeeeeeeeee']
            };
            nicknames = data[key.text];
            nicknames = nicknames ? nicknames : [];
            At.view.load(nicknames);
        }
    };

    At.view = {
        running : false,
        cur_li_idx : 0,
        id : '#at-view',
        onkeydown:function(e) {
            last_idx = $(this.id).find("ul li").length - 1;
            $(this.id + " ul li.cur").removeClass("cur");
            switch (e.keyCode) {
                case 38:
                    if (last_idx <= 0) return false;
                    this.cur_li_idx--;
                    if (this.cur_li_idx < 0)
                        this.cur_li_idx = last_idx;
                    $(this.id + " li:eq(" + this.cur_li_idx + ")")
                        .addClass('cur');
                    return false;
                    break;
                case 40:
                    if (last_idx <= 0) return false;
                    this.cur_li_idx++;
                    if (this.cur_li_idx > last_idx)
                        this.cur_li_idx = 0;
                    $(this.id + " li:eq(" + this.cur_li_idx + ")")
                        .addClass('cur');
                    return false;
                    break;
                case 13:
                    if (last_idx <= 0) return false;
                    $cur_li = $(this.id + " li:eq("+this.cur_li_idx+")");
                    At.choose($cur_li);
                    this.hide();
                    return false;
                    break;
                default:
                    return true
            }
        },
        onLoaded: function($view) {
            at = this;
            $view.click(function(e) {
                e.target.tagName == "LI" && at.choose($(e.target))
            });
            $view.mousemove(function(e) {
                if (e.target.tagName == "LI") {
                    $(this).find("li:eq(" + at.cur_li_idx + ")").removeClass("cur");
                    $(e.target).addClass("cur");
                    at.cur_li_idx = $(this).find("li").index(e.target)
                }
            })
        },
        rePosition:function() {
            $(this.id).offset({'top':0,'left':0}).offset(At.offset());
        },
        show: function(){
            if (this.running)
                return true;
            var view = this;
            At.$inputor.bind("keydown",function(e) {
                return view.onkeydown(e);
            })
            .bind("keyup",function(e) {
                //upword or downword
                if (e.keyCode == 40 || e.keyCode == 38)
                return false;
            });
            $view = $(this.id).show();
            this.rePosition($view);
            this.running = true;
        },
        hide: function() {
            At.$inputor.unbind();
            $(this.id).hide();
            this.running = false;
        },
        load: function(name_list) {
            $at_view = $(this.id);
            //init
            this.cur_li_idx = 0;
            if ($at_view.length == 0) {
                tpl = "<div id='"+this.id.slice(1)+"' class='at-view'><span>@who?</span><ul id='"+this.id.slice(1)+"-ul'></ul></div>";
                $at_view = $(tpl);
                $('body').append($at_view);
                $at_view = $(this.id);
                this.onLoaded($at_view);
            }

            //update data;
            li_tpl = "";
            $.each(name_list,function(i,name){
                li_tpl += "<li>" + name + "</li>";
            });
            $at_view.find('ul:first').html(li_tpl);
            $(this.id+ " li:eq(0)").addClass("cur");
            this.show();
            this.length = name_list.length;
            return $at_view;
        }
    };
    
    $.fn.atWho = function (options) {
        At.init(options);
        $inputor = $(this).find('textarea:first');
        this.keyup(function(){
            At.run($inputor);
            //At.test($inputor);
        })
        .mouseup(function(){
            At.run($inputor);
            //At.test($inputor);
        });
        return this;
    }
})(jQuery);
