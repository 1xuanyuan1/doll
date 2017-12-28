var __reflect = (this && this.__reflect) || function (p, c, t) {
    p.__class__ = c, t ? t.push(c) : t = [c], p.__types__ = p.__types__ ? t.concat(p.__types__) : t;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////
var Actions;
(function (Actions) {
    Actions[Actions["LEFT"] = 0] = "LEFT";
    Actions[Actions["RIGHT"] = 1] = "RIGHT";
    Actions[Actions["UP"] = 2] = "UP";
    Actions[Actions["DOWN"] = 3] = "DOWN";
})(Actions || (Actions = {}));
; // 移动的类型
var Main = (function (_super) {
    __extends(Main, _super);
    function Main() {
        var _this = _super.call(this) || this;
        _this._position = 0; // 横坐标移动的位置
        _this._positionY = 0; // 纵坐标移动的位置
        _this._step = 10; // 顶部每次点击移动的步
        _this._isRunning = false; // 是否正在动
        _this._isStarting = false; // 游戏是否正在运行
        _this._probability = .5; // 娃娃抓起后 成功的概率
        // 一堆娃娃
        _this._toys = [];
        // 一堆阴影
        _this._masks = [];
        _this.addEventListener(egret.Event.ADDED_TO_STAGE, _this.onAddToStage, _this);
        return _this;
    }
    Main.prototype.onAddToStage = function (event) {
        egret.lifecycle.addLifecycleListener(function (context) {
            // custom lifecycle plugin
            context.onUpdate = function () {
                // console.log('hello,world')
            };
        });
        egret.lifecycle.onPause = function () {
            egret.ticker.pause();
        };
        egret.lifecycle.onResume = function () {
            egret.ticker.resume();
        };
        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);
        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    };
    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    Main.prototype.onConfigComplete = function (event) {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    };
    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    Main.prototype.onResourceLoadComplete = function (event) {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    Main.prototype.onItemLoadError = function (event) {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    };
    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    Main.prototype.onResourceLoadError = function (event) {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    };
    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    Main.prototype.onResourceProgress = function (event) {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    };
    Main.prototype.checkCollision = function (stageX, stageY) {
        /// 小圆点同步手指位置
        this._dot.x = stageX;
        this._dot.y = stageY;
    };
    Main.prototype.directionClick = function (stageX, stageY) {
        var _this = this;
        if (this._isStarting) {
            if (this._up.hitTestPoint(stageX, stageY, true)) {
                this.move(Actions.UP);
                return;
            }
            if (this._down.hitTestPoint(stageX, stageY, true)) {
                this.move(Actions.DOWN);
                return;
            }
            if (this._left.hitTestPoint(stageX, stageY, true)) {
                this.move(Actions.LEFT);
                return;
            }
            if (this._right.hitTestPoint(stageX, stageY, true)) {
                this.move(Actions.RIGHT);
                return;
            }
            if (this._btn.hitTestPoint(stageX, stageY, true)) {
                // console.log('zhua')
                if (this._isRunning)
                    return;
                this._isRunning = true;
                var moveHight_1 = this._zhuaMask.y - this._zhua.y - this._zhua.height - 50;
                console.log("moveHight: " + moveHight_1);
                // 线的动画
                egret.Tween.get(this._line).to({ height: this._line.height + moveHight_1 }, 500, egret.Ease.sineIn).wait(100)
                    .to({ height: this._line.height }, 500, egret.Ease.sineOut).wait(100);
                // 爪子的动画
                egret.Tween.get(this._zhua).to({ y: this._zhua.y + moveHight_1 }, 500, egret.Ease.sineIn).wait(100)
                    .call(function () {
                    // 换爪子
                    _this._zhua.texture = RES.getRes('zhua2_png');
                    _this._zhua.x += 38;
                    _this._zhua.width = 107;
                    var x = _this._zhua.x + _this._zhua.width / 2;
                    var y = _this._zhua.y + _this._zhua.height;
                    var _loop_1 = function (index) {
                        var toy = _this._toys[index];
                        if (toy.hitTestPoint(x, y, true)) {
                            egret.Tween.get(toy).to({ y: toy.y - moveHight_1 }, 500, egret.Ease.sineOut).wait(100)
                                .call(function () {
                                var isSuccess = Math.random() > _this._probability;
                                if (isSuccess) {
                                    var mask = _this._masks[index];
                                    // 若成功则删除阴影
                                    _this.removeChild(mask);
                                    // 在数组里删除该对象
                                    _this._masks.splice(parseInt(index), 1);
                                    if (_this._masks.length > 0) {
                                        _this._selectMask.x = _this._masks[0].x;
                                        _this._selectMask.y = _this._masks[0].y;
                                    }
                                    else {
                                        _this.removeChild(_this._selectMask);
                                    }
                                    egret.Tween.get(toy)
                                        .to({ x: toy.x - _this._position }, 300, egret.Ease.sineIn).wait(100)
                                        .to({ y: toy.y + moveHight_1 - _this._positionY }, 300, egret.Ease.sineIn)
                                        .call(function () {
                                        // 动画完成后 在画布上删除该对象
                                        _this.removeChild(toy);
                                        // 在数组里删除该对象
                                        _this._toys.splice(parseInt(index), 1);
                                        // 娃娃抓完后重新开始游戏
                                        if (_this._toys.length === 0) {
                                            setTimeout(function () {
                                                _this._isStarting = false;
                                                _this.toggleShow(_this._isStarting);
                                            });
                                        }
                                    });
                                }
                                else {
                                    var funcChange = function () {
                                        toy.rotation = Math.random() * 20 - 10;
                                    };
                                    egret.Tween.get(toy, { onChange: funcChange, onChangeObj: _this })
                                        .to({ y: toy.y + moveHight_1 }, 300, egret.Ease.sineIn);
                                }
                            });
                            return { value: void 0 };
                        }
                    };
                    // 如果能抓到
                    for (var index in _this._toys) {
                        var state_1 = _loop_1(index);
                        if (typeof state_1 === "object")
                            return state_1.value;
                    }
                })
                    .to({ y: this._zhua.y }, 500, egret.Ease.sineOut).wait(100)
                    .call(function () { _this._isRunning = false; _this.back(); });
                return;
            }
        }
        else {
            if (this._start.hitTestPoint(stageX, stageY, true)) {
                this._isStarting = true;
                this.toggleShow(this._isStarting);
                this.initToy();
            }
        }
    };
    /**
     * 是否显示游戏界面
     */
    Main.prototype.toggleShow = function (isShow) {
        this._up.$setVisible(isShow);
        this._down.$setVisible(isShow);
        this._left.$setVisible(isShow);
        this._right.$setVisible(isShow);
        this._btn.$setVisible(isShow);
        this._start.$setVisible(!isShow);
    };
    /**
     *  顶部爪子移动
     */
    Main.prototype.move = function (action) {
        var _this = this;
        if (action === Actions.RIGHT || action === Actions.LEFT) {
            // 左移不能小于0  右边不能大于410
            if ((action === Actions.LEFT && this._position < 1) || (action === Actions.RIGHT && this._position > 510))
                return;
            var change = action === Actions.RIGHT ? this._step : -1 * this._step; // 右移则为+
            this._position += change;
            egret.Tween.get(this._top).to({ x: this._top.x + change }, 100, egret.Ease.sineIn);
            egret.Tween.get(this._line).to({ x: this._line.x + change }, 100, egret.Ease.sineIn);
            egret.Tween.get(this._zhuaShade).to({ x: this._zhuaShade.x + change }, 100, egret.Ease.sineIn);
            egret.Tween.get(this._zhuaMask).to({ x: this._zhuaMask.x + change }, 100, egret.Ease.sineIn);
            egret.Tween.get(this._zhua).to({ x: this._zhua.x + change }, 100, egret.Ease.sineIn)
                .call(function () {
                _this.moveEnd(action);
            });
        }
        else {
            var change = action === Actions.UP ? -1 * this._step : this._step; // 上移则为-
            this._positionY += change;
            egret.Tween.get(this._zhuaShade).to({ y: this._zhuaShade.y + change }, 100, egret.Ease.sineIn);
            egret.Tween.get(this._zhuaMask).to({ y: this._zhuaMask.y + change }, 100, egret.Ease.sineIn)
                .call(function () {
                _this.moveEnd(action);
            });
        }
    };
    /**
     *  移动结束之后
     */
    Main.prototype.moveEnd = function (action) {
        var _this = this;
        if (this._dot.parent) {
            setTimeout(function () {
                _this.move(action);
            }, 30);
        }
        for (var _i = 0, _a = this._masks; _i < _a.length; _i++) {
            var mask = _a[_i];
            var x = mask.x + mask.width / 2;
            var y = mask.y + mask.height / 2;
            if (this._zhuaMask.hitTestPoint(x, y, true)) {
                this._selectMask.x = mask.x;
                this._selectMask.y = mask.y;
                // 若选中的阴影不是正好在娃娃阴影的上面 则将其挪到上面
                if (this.getChildIndex(this._zhuaShade) - this.getChildIndex(mask) !== 1) {
                    var index = this.getChildIndex(mask);
                    this.setChildIndex(this._zhuaShade, index);
                    this.setChildIndex(this._zhua, index);
                    this.setChildIndex(this._line, index);
                }
                return;
            }
        }
    };
    /**
     *  回到初始化的位置
     */
    Main.prototype.back = function () {
        var _this = this;
        egret.Tween.get(this._top).to({ x: this._top.x - this._position }, 300, egret.Ease.sineIn);
        egret.Tween.get(this._line).to({ x: this._line.x - this._position }, 300, egret.Ease.sineIn);
        egret.Tween.get(this._zhuaMask).to({ x: this._zhuaMask.x - this._position, y: this._zhuaMask.y - this._positionY }, 300, egret.Ease.sineIn);
        egret.Tween.get(this._zhuaShade).to({ x: this._zhuaShade.x - this._position, y: this._zhuaMask.y - this._positionY }, 300, egret.Ease.sineIn);
        egret.Tween.get(this._zhua).to({ x: this._zhua.x - this._position }, 300, egret.Ease.sineIn)
            .call(function () {
            // 重置位置
            _this._position = 0;
            _this._positionY = 0;
            // 换回爪子
            _this._zhua.texture = RES.getRes('zhua1_png');
            _this._zhua.x -= 38;
            _this._zhua.width = 183;
        });
    };
    /**
     * 初始化娃娃
     */
    Main.prototype.initToy = function () {
        for (var j = 0; j < 3; j++) {
            for (var i = 0; i < 3; i++) {
                var toy = this.createBitmapByName("cartoon-egret_00_png");
                toy.width = 114;
                toy.height = 190;
                toy.x = 460 - i * 120 - (j % 2) * 80;
                toy.y = 570 - j * 100;
                toy.rotation = Math.random() * 20 - 10;
                toy.name = "toy_" + (i + 1) + "_" + (j + 1);
                this.addChild(toy);
                this.setChildIndex(toy, 6); // 深度 刚好要在框框内
                this._toys.push(toy);
                var mask = new egret.Shape;
                mask.graphics.lineStyle(0x000000);
                mask.graphics.beginFill(0x000000);
                mask.graphics.drawEllipse(0, 0, 114, 50);
                mask.graphics.endFill();
                mask.x = 460 - i * 120 - (j % 2) * 80;
                mask.y = 730 - j * 100;
                mask.name = "mask_" + (i + 1) + "_" + (j + 1);
                this.addChild(mask);
                this.setChildIndex(mask, 6); // 深度 刚好要在框框内
                this._masks.push(mask);
            }
        }
        this._selectMask = new egret.Shape;
        this._selectMask.name = '_selectMask';
        this._selectMask.graphics.lineStyle(0x000000);
        this._selectMask.graphics.beginFill(0x000000);
        this._selectMask.graphics.drawEllipse(0, 0, 114, 50);
        this._selectMask.graphics.endFill();
        this._selectMask.x = 460;
        this._selectMask.y = 730;
        this.addChild(this._selectMask);
        this.setChildIndex(this._selectMask, 6); // 深度 刚好要在框框内
        this._zhuaShade.$setVisible(true);
        this._zhuaMask.$setVisible(true);
        this._zhuaShade.$mask = this._selectMask;
    };
    /**
     *  点击事件
     */
    Main.prototype.touchHandler = function (evt) {
        switch (evt.type) {
            case egret.TouchEvent.TOUCH_MOVE:
                this.checkCollision(evt.stageX, evt.stageY);
                // console.log('move', evt.stageX, evt.stageY)
                break;
            case egret.TouchEvent.TOUCH_BEGIN:
                this.stage.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchHandler, this);
                this.stage.once(egret.TouchEvent.TOUCH_END, this.touchHandler, this);
                this.addChild(this._dot);
                this.checkCollision(evt.stageX, evt.stageY);
                this.directionClick(evt.stageX, evt.stageY);
                // console.log('begin', evt.stageX, evt.stageY)
                break;
            case egret.TouchEvent.TOUCH_END:
                this.stage.removeEventListener(egret.TouchEvent.TOUCH_MOVE, this.touchHandler, this);
                this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchHandler, this);
                if (this._dot.parent) {
                    this._dot.parent.removeChild(this._dot);
                }
                break;
        }
    };
    //
    /**
     * 创建游戏场景
     * Create a game scene
     */
    Main.prototype.createGameScene = function () {
        this.stage.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.touchHandler, this);
        // 背景
        var bg = this.createBitmapByName("bg_png");
        bg.width = 586;
        bg.height = 745;
        bg.x = 65;
        bg.y = 45;
        this.addChild(bg);
        // 顶部
        this._top = this.createBitmapByName("top_png");
        this._top.name = 'top';
        this._top.width = 119;
        this._top.height = 46;
        this._top.x = 90;
        this._top.y = 45;
        this.addChild(this._top);
        // 线
        this._line = this.createBitmapByName("line_png");
        this._line.name = 'line';
        this._line.width = 15;
        this._line.height = 71;
        this._line.x = 142;
        this._line.y = 90;
        this.addChild(this._line);
        // 抓
        this._zhua = this.createBitmapByName("zhua1_png");
        this._zhua.name = 'zhua';
        this._zhua.width = 183;
        this._zhua.height = 155;
        this._zhua.x = 59;
        this._zhua.y = 161;
        this.addChild(this._zhua);
        this._zhuaMask = new egret.Shape;
        this._zhuaMask.name = 'zhuaMask';
        this._zhuaMask.graphics.beginFill(0x333333);
        this._zhuaMask.graphics.drawEllipse(0, 0, 140, 70);
        this._zhuaMask.graphics.endFill();
        this._zhuaMask.x = 59;
        this._zhuaMask.y = 730;
        this._zhuaMask.$setVisible(false);
        this.addChild(this._zhuaMask);
        this._zhuaShade = new egret.Shape;
        this._zhuaShade.name = 'zhuaShade';
        this._zhuaShade.graphics.beginFill(0x00FF00);
        this._zhuaShade.graphics.drawEllipse(0, 0, 140, 70);
        this._zhuaShade.graphics.endFill();
        this._zhuaShade.x = 59;
        this._zhuaShade.y = 730;
        this._zhuaShade.$setVisible(false);
        this.addChild(this._zhuaShade);
        // 娃娃
        // for (let i = 0;i < 4; i++) {
        //     let toy = this.createBitmapByName("cartoon-egret_00_png")
        //     toy.width = 114
        //     toy.height = 190
        //     toy.x = 460 - i * 80;
        //     toy.y = 570;
        //     this.addChild(toy)
        //     this._toys.push(toy)
        // }
        // 背景
        var dollbg = this.createBitmapByName("doll_bg_png");
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        dollbg.width = stageW;
        dollbg.height = stageH;
        dollbg.name = 'dollbg';
        this.addChild(dollbg);
        // // 方向键
        // let direction = this.createBitmapByName("btn_direction_png");
        // direction.width = 355;
        // direction.height = 196;
        // direction.y = 800;
        // this.addChild(direction);
        // 方向键 上
        this._up = this.createBitmapByName("up_png");
        this._up.name = 'up';
        this._up.width = 119;
        this._up.height = 109;
        this._up.x = 120;
        this._up.y = 750;
        this._up.$setVisible(false);
        this.addChild(this._up);
        // 方向键 左
        this._left = this.createBitmapByName("left_png");
        this._left.name = 'left';
        this._left.width = 179;
        this._left.height = 119;
        this._left.y = 840;
        this._left.$setVisible(false);
        this.addChild(this._left);
        // 方向键 右
        this._right = this.createBitmapByName("right_png");
        this._right.name = 'right';
        this._right.width = 179;
        this._right.height = 119;
        this._right.x = 179;
        this._right.y = 840;
        this._right.$setVisible(false);
        this.addChild(this._right);
        // 方向键 下
        this._down = this.createBitmapByName("down_png");
        this._down.name = 'down';
        this._down.width = 119;
        this._down.height = 109;
        this._down.x = 120;
        this._down.y = 939;
        this._down.$setVisible(false);
        this.addChild(this._down);
        // 抓的按钮
        this._btn = this.createBitmapByName("btn_zhua1_png");
        this._btn.width = 241;
        this._btn.height = 159;
        this._btn.x = 370;
        this._btn.y = 815;
        this._btn.$setVisible(false);
        this.addChild(this._btn);
        // 开始按钮
        this._start = this.createBitmapByName("btn_start_png");
        this._start.width = 367;
        this._start.height = 119;
        this._start.x = 140;
        this._start.y = 835;
        this.addChild(this._start);
        /// 小圆点，用以提示用户按下位置
        this._dot = new egret.Shape;
        this._dot.graphics.beginFill(0x00ff00);
        this._dot.graphics.drawCircle(0, 0, 5);
        this._dot.graphics.endFill();
    };
    Main.prototype.launchCollisionTest = function () {
        // this._iTouchCollideStatus = TouchCollideStatus.NO_TOUCHED;
        // this._bShapeTest = false;
        // this.stage.addEventListener( egret.TouchEvent.TOUCH_BEGIN, this.touchHandler, this );
        // this.updateInfo( TouchCollideStatus.NO_TOUCHED );
    };
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    Main.prototype.createBitmapByName = function (name) {
        var result = new egret.Bitmap();
        var texture = RES.getRes(name);
        result.texture = texture;
        return result;
    };
    return Main;
}(egret.DisplayObjectContainer));
__reflect(Main.prototype, "Main");
//# sourceMappingURL=Main.js.map