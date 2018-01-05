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
        _this._isCountdown = false; // 是否正在倒计时 / 本轮游戏是否正在进行
        _this._probability = .5; // 娃娃抓起后 成功的概率
        _this._catchIndex = -1; // 抓到的娃娃的位置  -1时为未抓到
        _this._moveHight = -1; // 动画移动的高度
        _this._wawaids = {
            '5a3e103e85d7c00602406446': 'wawa0',
            '5a3e107485d7c00602406447': 'wawa2',
            '5a445b447e6b1e01155ceb08': 'wawa1',
            '5a445b7c7e6b1e01155ceb09': 'wawa3',
            '5a445b857e6b1e01155ceb0a': 'wawa4',
            '5a445b8d7e6b1e01155ceb0b': 'wawa5',
            '5a4c86e2c5f56040a6b5f5c5': 'wawa10',
            '5a4c8756c5f56040a6b5f5c6': 'wawa13',
            '5a4c8775c5f56040a6b5f5c7': 'wawa8',
            '5a4c8785c5f56040a6b5f5c8': 'wawa11',
            '5a4c8795c5f56040a6b5f5c9': 'wawa7',
            '5a4c87aac5f56040a6b5f5ca': 'wawa6',
            '5a4c87bdc5f56040a6b5f5cb': 'wawa14',
            '5a4c87d3c5f56040a6b5f5cc': 'wawa9',
            '5a4c87ebc5f56040a6b5f5cd': 'wawa12' // 可爱神兽草泥马 
        };
        _this._wawaName = 'wawa';
        _this._param = {}; // 网络传过来的值
        _this._gametime = 20; // 一局游戏时间
        _this._time = 20; // 倒计时 默认倒计时30s
        _this._key = ''; // 没开始一次获取到一个游戏的Key可以用来抓一次娃娃 每次抓完后 重置为空
        // 一堆娃娃
        _this._toys = [];
        // 一堆阴影
        _this._masks = [];
        _this.getWawaName();
        _this.addEventListener(egret.Event.ADDED_TO_STAGE, _this.onAddToStage, _this);
        return _this;
    }
    /**
     * 获得娃娃的名字
     */
    Main.prototype.getWawaName = function () {
        var search = window.location.search.replace('?', '');
        if (search !== '') {
            var param = {};
            for (var _i = 0, _a = search.split('&'); _i < _a.length; _i++) {
                var item = _a[_i];
                var kv = item.split('=');
                param[kv[0]] = kv[1];
            }
            this._param = param;
            this._wawaName = this._wawaids[param['wawaid']] || 'wawa';
            // console.log(param)
        }
    };
    /**
     * 开始玩游戏
     */
    Main.prototype.startGame = function () {
        var _this = this;
        try {
            // 提示用户是否有游戏币能开始玩游戏
            var self_1 = this;
            window.parent['startGame'](this._param['wawaid'], function (key) {
                self_1._isStarting = true;
                self_1.toggleShow(true);
                self_1._isCountdown = true;
                self_1.countdown(_this._gametime);
                self_1._key = key;
            });
        }
        catch (e) {
            console.log('开始玩游戏失败');
        }
    };
    /**
     * 继续玩游戏
     * @param {*} isSuccess 是否成功抓到娃娃
     */
    Main.prototype.continueGame = function (isSuccess) {
        this._isStarting = false;
        this.toggleShow(false);
        this.setGameTime(this._gametime);
        try {
            // 提示用户是否继续玩
            var self_2 = this;
            window.parent['continue'](isSuccess);
        }
        catch (e) {
            console.log('继续玩游戏失败');
        }
        // try {
        //     // 提示用户是否继续玩
        //     let self = this
        //     window.parent['continue'](isSuccess, () => {
        //         // 开始倒计时
        //         self._isCountdown = true
        //         self.countdown(30)
        //     }, () => {
        //         self._isStarting = false
        //         self.toggleShow(false)
        //     });
        // } catch (e) {
        //     console.log('继续玩游戏失败')
        // }
    };
    /**
     * 抓取娃娃
     */
    Main.prototype.catchToy = function () {
        var request = new egret.HttpRequest();
        request.responseType = egret.HttpResponseType.TEXT;
        //设置为 POST 请求
        request.open("api/game/catch", egret.HttpMethod.POST);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.setRequestHeader("X-Auth-Token", this._param['token']);
        request.send("prizeId=" + this._param['wawaid'] + "&token=" + this._key);
        request.addEventListener(egret.Event.COMPLETE, this.onCatchCallback, this);
    };
    /**
     * 抓娃娃回调
     */
    Main.prototype.onCatchCallback = function (event) {
        var _this = this;
        // console.log('onCatchCallback', event)
        var request = event.currentTarget;
        var isSuccess = false;
        if (request.response != '') {
            try {
                isSuccess = JSON.parse(request.response).content != null;
            }
            catch (e) {
                console.log('抓娃娃时，回调解析出错');
            }
        }
        var toy = this._toys[this._catchIndex];
        var moveHight = this._moveHight;
        if (isSuccess) {
            var mask = this._masks[this._catchIndex];
            // 若成功则删除阴影
            this.removeChild(mask);
            // 在数组里删除该对象
            this._masks.splice(this._catchIndex, 1);
            egret.Tween.get(toy)
                .to({ x: toy.x - this._position }, 300, egret.Ease.sineIn).wait(100)
                .to({ y: toy.y + moveHight - this._positionY }, 300, egret.Ease.sineIn)
                .call(function () {
                // 动画完成后 在画布上删除该对象
                _this.removeChild(toy);
                // 在数组里删除该对象
                _this._toys.splice(_this._catchIndex, 1);
                // 娃娃抓完后 重新填满娃娃  ps.修复
                if (_this._toys.length === 0) {
                    setTimeout(function () {
                        // this._isStarting = false
                        // this.toggleShow(this._isStarting)
                        _this.initToy();
                    }, 0);
                }
                _this.continueGame(isSuccess);
            });
        }
        else {
            var funcChange = function () {
                toy.rotation = Math.random() * 30 - 15;
            };
            var funcBack = function () {
                toy.rotation = 0;
            };
            egret.Tween.get(toy, { onChange: funcChange, onChangeObj: this })
                .to({ y: toy.y + moveHight - 50 }, 300, egret.Ease.sineIn).call(function () {
                egret.Tween.get(toy, { onChange: funcBack, onChangeObj: _this })
                    .to({ y: toy.y + 50 }, 100, egret.Ease.sineIn).call(function () {
                    _this.continueGame(isSuccess);
                });
            });
        }
        // 重置被抓取的娃娃序号
        this._catchIndex = -1;
    };
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
    /**
     * 监听事件
     */
    Main.prototype.directionClick = function (stageX, stageY) {
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
                this._isCountdown = false;
                this.toZhua();
                return;
            }
        }
        else {
            if (this._start.hitTestPoint(stageX, stageY, true)) {
                // 改为调用接口之后才能开始玩游戏
                this.startGame();
                //  隐藏的是普通玩游戏
                // this._isStarting = true
                // this.toggleShow(this._isStarting)
                // // 开始倒计时
                // this._isCountdown = true
                // this.countdown(30)
            }
        }
    };
    /**
     * 去抓娃娃
     */
    Main.prototype.toZhua = function () {
        var _this = this;
        var moveHight = this._zhuaMask.y - this._zhua.y - this._zhua.height - 50;
        this._moveHight = moveHight;
        // 线的动画
        egret.Tween.get(this._line).to({ height: this._line.height + moveHight }, 500, egret.Ease.sineIn).wait(100)
            .to({ height: this._line.height }, 500, egret.Ease.sineOut).wait(100);
        // 爪子的动画
        egret.Tween.get(this._zhua).to({ y: this._zhua.y + moveHight }, 500, egret.Ease.sineIn).wait(100)
            .call(function () {
            // 换爪子
            _this._zhua.texture = RES.getRes('zhua2_png');
            var x = _this._zhua.x + _this._zhua.width / 2;
            var y = _this._zhua.y + _this._zhua.height;
            var _loop_1 = function (index) {
                var toy = _this._toys[index];
                if (toy.hitTestPoint(x, y, true)) {
                    egret.Tween.get(toy).to({ y: toy.y - moveHight }, 500, egret.Ease.sineOut).wait(100)
                        .call(function () {
                        _this._catchIndex = parseInt(index);
                        // 后台判断 是否抓到娃娃
                        _this.catchToy();
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
            // 如果碰到没碰到娃娃
            _this.continueGame(false);
        })
            .to({ y: this._zhua.y }, 500, egret.Ease.sineOut).wait(100)
            .call(function () { _this._isRunning = false; _this.back(); });
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
            egret.Tween.get(this._zhuaMask).to({ x: this._zhuaMask.x + change }, 100, egret.Ease.sineIn);
            egret.Tween.get(this._zhua).to({ x: this._zhua.x + change }, 100, egret.Ease.sineIn)
                .call(function () {
                _this.moveEnd(action);
            });
        }
        else {
            // 下移不能小于0  上移不能大于220
            if ((action === Actions.DOWN && this._positionY >= 0) || (action === Actions.UP && this._positionY <= -220))
                return;
            var change = action === Actions.UP ? -1 * this._step : this._step; // 上移则为-
            this._positionY += change;
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
                // 若选中的阴影不是正好在娃娃阴影的上面 则将其挪到上面
                if (this.getChildIndex(this._zhua) - this.getChildIndex(mask) !== 1) {
                    var index = this.getChildIndex(mask);
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
        egret.Tween.get(this._zhua).to({ x: this._zhua.x - this._position }, 300, egret.Ease.sineIn)
            .call(function () {
            // 重置位置
            _this._position = 0;
            _this._positionY = 0;
            // 换回爪子
            _this._zhua.texture = RES.getRes('zhua1_png');
        });
    };
    /**
     * 初始化娃娃
     */
    Main.prototype.initToy = function () {
        for (var j = 0; j < 3; j++) {
            var num = j === 0 ? 2 : 3;
            var left = j === 0 ? 0 : (2 - j) * 60;
            for (var i = 0; i < num; i++) {
                var toy = this.createBitmapByName(this._wawaName + "_png");
                toy.width = 169;
                toy.height = 176;
                toy.x = 500 - i * 180 - left;
                toy.y = 650 - j * 100;
                // toy.rotation = Math.random() * 20 - 10
                toy.name = "toy_" + (i + 1) + "_" + (j + 1);
                this.addChild(toy);
                this.setChildIndex(toy, 5); // 深度 刚好要在框框内
                this._toys.push(toy);
                var mask = new egret.Shape;
                mask.graphics.lineStyle(0x000000);
                mask.graphics.beginFill(0x37516e, 0.2);
                mask.graphics.drawEllipse(0, 0, 100, 40);
                mask.graphics.endFill();
                mask.x = 530 - i * 180 - left;
                mask.y = 800 - j * 100;
                mask.name = "mask_" + (i + 1) + "_" + (j + 1);
                this.addChild(mask);
                this.setChildIndex(mask, 5); // 深度 刚好要在框框内
                this._masks.push(mask);
            }
        }
        this._zhuaMask.$setVisible(true);
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
        bg.width = 646;
        bg.height = 728;
        bg.x = 52;
        bg.y = 130;
        bg.name = 'bg';
        this.addChild(bg);
        // 顶部
        this._top = this.createBitmapByName("top_png");
        this._top.name = 'top';
        this._top.width = 28;
        this._top.height = 18;
        this._top.x = 102;
        this._top.y = 130;
        this.addChild(this._top);
        // 线
        this._line = this.createBitmapByName("line_png");
        this._line.name = 'line';
        this._line.width = 12;
        this._line.height = 50;
        this._line.x = 110;
        this._line.y = 146;
        this.addChild(this._line);
        // 抓
        this._zhua = this.createBitmapByName("zhua1_png");
        this._zhua.name = 'zhua';
        this._zhua.width = 174;
        this._zhua.height = 190;
        this._zhua.x = 29;
        this._zhua.y = 191;
        this.addChild(this._zhua);
        this._zhuaMask = new egret.Shape;
        this._zhuaMask.name = 'zhuaMask';
        this._zhuaMask.graphics.beginFill(0x37516e, 0.3);
        this._zhuaMask.graphics.drawEllipse(0, 0, 140, 70);
        this._zhuaMask.graphics.endFill();
        this._zhuaMask.x = 59;
        this._zhuaMask.y = 800;
        this._zhuaMask.$setVisible(false);
        this.addChild(this._zhuaMask);
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
        // 娃娃掉出口
        var exit = this.createBitmapByName("exit_png");
        exit.width = 210;
        exit.height = 204;
        exit.x = 52;
        exit.y = 654;
        exit.name = 'exit';
        this.addChild(exit);
        // 背景
        var dollbg = this.createBitmapByName("doll_bg_png");
        var stageW = this.stage.stageWidth;
        var stageH = this.stage.stageHeight;
        dollbg.width = 708;
        dollbg.height = 906;
        dollbg.x = 21;
        dollbg.name = 'dollbg';
        this.addChild(dollbg);
        // 方向键 上
        this._up = this.createBitmapByName("up_png");
        this._up.name = 'up';
        this._up.width = 90;
        this._up.height = 94;
        this._up.x = 160;
        this._up.y = 920;
        this._up.$setVisible(false);
        this.addChild(this._up);
        // 方向键 左
        this._left = this.createBitmapByName("left_png");
        this._left.name = 'left';
        this._left.width = 90;
        this._left.height = 94;
        this._left.x = 40;
        this._left.y = 980;
        this._left.$setVisible(false);
        this.addChild(this._left);
        // 方向键 右
        this._right = this.createBitmapByName("right_png");
        this._right.name = 'right';
        this._right.width = 90;
        this._right.height = 94;
        this._right.x = 280;
        this._right.y = 980;
        this._right.$setVisible(false);
        this.addChild(this._right);
        // 方向键 下
        this._down = this.createBitmapByName("down_png");
        this._down.name = 'down';
        this._down.width = 90;
        this._down.height = 94;
        this._down.x = 160;
        this._down.y = 1040;
        this._down.$setVisible(false);
        this.addChild(this._down);
        // 抓的按钮
        this._btn = this.createBitmapByName("btn_zhua_png");
        this._btn.name = 'btn_zhua';
        this._btn.width = 188;
        this._btn.height = 176;
        this._btn.x = 500;
        this._btn.y = 910;
        this._btn.$setVisible(false);
        this.addChild(this._btn);
        // 开始按钮
        this._start = this.createBitmapByName("btn_start_png");
        this._btn.name = 'btn_start';
        this._start.width = 342;
        this._start.height = 114;
        this._start.x = 204;
        this._start.y = 980;
        this.addChild(this._start);
        /// 小圆点，用以提示用户按下位置
        this._dot = new egret.Shape;
        this._dot.graphics.beginFill(0x00ff00);
        this._dot.graphics.drawCircle(0, 0, 5);
        this._dot.graphics.endFill();
        this.initToy();
    };
    Main.prototype.setGameTime = function (time) {
        try {
            window.parent['setGameTime'](time);
        }
        catch (e) {
            console.log('倒计时失败');
        }
    };
    Main.prototype.countdown = function (time) {
        var _this = this;
        this.setGameTime(time);
        setTimeout(function () {
            if (time > 0) {
                // 若已经抓了则不继续倒计时
                _this._isCountdown && _this.countdown(time - 1);
            }
            else {
                // 若结束则开始抓
                _this._isCountdown = false;
                _this.toZhua();
            }
        }, 1000);
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