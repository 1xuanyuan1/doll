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
enum Actions { LEFT, RIGHT, UP, DOWN }; // 移动的类型
class Main extends egret.DisplayObjectContainer {

    /**
     * 加载进度界面
     * Process interface loading
     */
    private loadingView: LoadingUI;
    private _position:number = 0; // 横坐标移动的位置
    private _positionY:number = 0; // 纵坐标移动的位置
    private _step:number = 10; // 顶部每次点击移动的步
    private _isRunning:boolean = false; // 是否正在动
    private _isStarting:boolean = false; // 游戏是否正在运行
    private _isCountdown:boolean = false; // 是否正在倒计时 / 本轮游戏是否正在进行
    private _probability:number = .5; // 娃娃抓起后 成功的概率
    private _catchIndex:number = -1; // 抓到的娃娃的位置  -1时为未抓到
    private _wawaids = { // 所有的娃娃的ID
        '5a3e103e85d7c00602406446': 'wawa1', // 长耳兔
        '5a3e107485d7c00602406447': 'wawa2', // 不二兔
        '5a445b447e6b1e01155ceb08': 'wawa3', // 小猪佩奇
        '5a445b7c7e6b1e01155ceb09': 'wawa4', // 玻尿梭鸭
        '5a445b857e6b1e01155ceb0a': 'wawa5', // 表情萝卜
        '5a445b8d7e6b1e01155ceb0b': 'wawa6' // 保卫萝卜
    }
    private _wawaName:string = 'wawa'
    private _param = {} // 网络传过来的值
    private _time = 30 // 倒计时 默认倒计时30s
    private _txCountdown:egret.TextField; // 倒计时显示

    public constructor() {
        super();
        this.getWawaName()
        this.addEventListener(egret.Event.ADDED_TO_STAGE, this.onAddToStage, this);
    }
    /**
     * 获得娃娃的名字
     */
    private getWawaName ():void {
        let search = window.location.search.replace('?', '')
        if (search !== '') {
            let param = {}
            for (let item of search.split('&')) {
                let kv = item.split('=')
                param[kv[0]] = kv[1]
            }
            this._param = param
            this._wawaName = this._wawaids[param['wawaid']] || 'wawa'
            console.log(param)
        }
    }
    /**
     * 开始玩游戏
     */
    private startGame () {
        var request = new egret.HttpRequest();
        request.responseType = egret.HttpResponseType.TEXT;
        //设置为 POST 请求
        request.open("api/game/start",egret.HttpMethod.POST);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.setRequestHeader("X-Auth-Token", this._param['token']);
        request.send();
        request.addEventListener(egret.Event.COMPLETE,this.onPostStartGame,this);
    }
    /**
     * 开始玩游戏接口回调
     */
    private onPostStartGame (res) {
        try {
            // 刷新用户剩余游戏币
            window.parent['updateInfoByGamecoin']();
        } catch (e) {
            console.log('error')
        }
    }
    /**
     * 抓取娃娃
     */
    private catchToy () {
        var request = new egret.HttpRequest();
        request.responseType = egret.HttpResponseType.TEXT;
        //设置为 POST 请求
        request.open("api/game/catch",egret.HttpMethod.POST);
        request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        request.setRequestHeader("X-Auth-Token", this._param['token']);
        request.send(`prizeId=${this._param['wawaid']}`);
        request.addEventListener(egret.Event.COMPLETE,this.onCatchCallback,this);
    }
    /**
     * 抓娃娃回调
     */
    private onCatchCallback (event:egret.Event) {
        // console.log('onCatchCallback', event)
        var request = <egret.HttpRequest>event.currentTarget;
        let isSuccess:boolean = request.response != ''
        let toy:egret.Bitmap = this._toys[this._catchIndex]
        let moveHight:number = this._zhuaMask.y - this._zhua.y - this._zhua.height - 50;
        if (isSuccess) {
            let mask = this._masks[this._catchIndex]
            // 若成功则删除阴影
            this.removeChild(mask);
            // 在数组里删除该对象
            this._masks.splice(this._catchIndex, 1);

            egret.Tween.get(toy)
            .to({x:toy.x - this._position }, 300, egret.Ease.sineIn).wait(100)
            .to({y:toy.y + moveHight - this._positionY}, 300, egret.Ease.sineIn )
            .call(() => { 
                // 动画完成后 在画布上删除该对象
                this.removeChild(toy);
                // 在数组里删除该对象
                this._toys.splice(this._catchIndex, 1);
                // 娃娃抓完后重新开始游戏
                if (this._toys.length === 0) {
                    setTimeout(() => {
                        this._isStarting = false
                        this.toggleShow(this._isStarting)
                    })
                }
                try {
                    // 提示用户是否继续玩
                    let self = this
                    window.parent['continue'](isSuccess, () => {
                        // 开始倒计时
                        self._isCountdown = true
                        self.countdown(30)
                    });
                } catch (e) {
                    console.log('error')
                }
            })
        } else {
            var funcChange = ():void => { // 改变角度
                toy.rotation = Math.random() * 30 - 15
            }
            var funcBack = ():void => { // 改变角度
                toy.rotation = 0
            }
            egret.Tween.get(toy, {onChange:funcChange, onChangeObj:this})
            .to({y:toy.y + moveHight - 50}, 300, egret.Ease.sineIn ).call(() => {
                egret.Tween.get(toy, {onChange:funcBack, onChangeObj:this}) 
                .to({y:toy.y + 50}, 100, egret.Ease.sineIn).call(() => { 
                    try {
                        // 提示用户是否继续玩
                        let self = this
                        window.parent['continue'](isSuccess, () => {
                            // 开始倒计时
                            self._isCountdown = true
                            self.countdown(30)
                        });
                    } catch (e) {
                        console.log('error')
                    }
                })
            })
        }
        // 重置被抓取的娃娃序号
        this._catchIndex = -1
    }

    private onAddToStage(event: egret.Event) {

        egret.lifecycle.addLifecycleListener((context) => {
            // custom lifecycle plugin

            context.onUpdate = () => {
                // console.log('hello,world')
            }
        })

        egret.lifecycle.onPause = () => {
            egret.ticker.pause();
        }

        egret.lifecycle.onResume = () => {
            egret.ticker.resume();
        }


        //设置加载进度界面
        //Config to load process interface
        this.loadingView = new LoadingUI();
        this.stage.addChild(this.loadingView);

        //初始化Resource资源加载库
        //initiate Resource loading library
        RES.addEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.loadConfig("resource/default.res.json", "resource/");
    }

    /**
     * 配置文件加载完成,开始预加载preload资源组。
     * configuration file loading is completed, start to pre-load the preload resource group
     */
    private onConfigComplete(event: RES.ResourceEvent): void {
        RES.removeEventListener(RES.ResourceEvent.CONFIG_COMPLETE, this.onConfigComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
        RES.addEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
        RES.addEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
        RES.loadGroup("preload");
    }

    /**
     * preload资源组加载完成
     * Preload resource group is loaded
     */
    private onResourceLoadComplete(event: RES.ResourceEvent) {
        if (event.groupName == "preload") {
            this.stage.removeChild(this.loadingView);
            RES.removeEventListener(RES.ResourceEvent.GROUP_COMPLETE, this.onResourceLoadComplete, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_LOAD_ERROR, this.onResourceLoadError, this);
            RES.removeEventListener(RES.ResourceEvent.GROUP_PROGRESS, this.onResourceProgress, this);
            RES.removeEventListener(RES.ResourceEvent.ITEM_LOAD_ERROR, this.onItemLoadError, this);
            this.createGameScene();
        }
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onItemLoadError(event: RES.ResourceEvent) {
        console.warn("Url:" + event.resItem.url + " has failed to load");
    }

    /**
     * 资源组加载出错
     *  The resource group loading failed
     */
    private onResourceLoadError(event: RES.ResourceEvent) {
        //TODO
        console.warn("Group:" + event.groupName + " has failed to load");
        //忽略加载失败的项目
        //Ignore the loading failed projects
        this.onResourceLoadComplete(event);
    }

    /**
     * preload资源组加载进度
     * Loading process of preload resource group
     */
    private onResourceProgress(event: RES.ResourceEvent) {
        if (event.groupName == "preload") {
            this.loadingView.setProgress(event.itemsLoaded, event.itemsTotal);
        }
    }
    private checkCollision( stageX:number, stageY:number ):void {
            /// 小圆点同步手指位置
        this._dot.x = stageX;
        this._dot.y = stageY;
        
    }
    /**
     * 监听事件
     */
    private directionClick (stageX:number, stageY:number):void {
        if (this._isStarting) {
            if (this._up.hitTestPoint(stageX, stageY, true)) {
                this.move(Actions.UP)
                return
            }
            if (this._down.hitTestPoint(stageX, stageY, true)) {
                this.move(Actions.DOWN)
                return
            }
            if (this._left.hitTestPoint(stageX, stageY, true)) {
                this.move(Actions.LEFT)
                return
            }
            if (this._right.hitTestPoint(stageX, stageY, true)) {
                this.move(Actions.RIGHT)
                return
            }
            if (this._btn.hitTestPoint(stageX, stageY, true)) {
                // console.log('zhua')
                if (this._isRunning) return
                this._isRunning = true
                this._isCountdown = false
                this.toZhua()
                return
            }
        } else {
            if (this._start.hitTestPoint(stageX, stageY, true)) {
                this._isStarting = true
                this.toggleShow(this._isStarting)
                this.initToy()
                
                // 开始游戏 调用接口
                this.startGame()
                // 开始倒计时
                this._isCountdown = true
                this.countdown(30)
            }
        } 
    }
    /**
     * 去抓娃娃
     */
    private toZhua () {
        let moveHight:number = this._zhuaMask.y - this._zhua.y - this._zhua.height - 50;
        // 线的动画
        egret.Tween.get( this._line ).to( {height:this._line.height + moveHight}, 500, egret.Ease.sineIn ).wait(100)
        .to( {height:this._line.height }, 500, egret.Ease.sineOut ).wait(100)
        
        // 爪子的动画
        egret.Tween.get( this._zhua ).to( {y:this._zhua.y + moveHight}, 500, egret.Ease.sineIn ).wait(100)
        .call(() => {
            // 换爪子
            this._zhua.texture = RES.getRes('zhua2_png');
            let x:number = this._zhua.x + this._zhua.width / 2
            let y:number = this._zhua.y + this._zhua.height

            // 如果能抓到
            for (let index in this._toys) {
                let toy:egret.Bitmap = this._toys[index]
                if (toy.hitTestPoint(x, y, true)) {
                    
                    egret.Tween.get(toy).to( {y:toy.y - moveHight}, 500, egret.Ease.sineOut ).wait(100)
                    .call(() => {
                        let isSuccess:boolean = Math.random() > this._probability
                        this._catchIndex = parseInt(index)
                        // 后台判断 是否抓到娃娃
                        this.catchToy()
                    })
                    return
                }
            }
        })
        .to({y:this._zhua.y}, 500, egret.Ease.sineOut).wait(100)
        .call(() => { this._isRunning = false; this.back();})
    }
    /**
     * 是否显示游戏界面
     */
    private toggleShow (isShow: boolean):void {
        this._up.$setVisible(isShow)
        this._down.$setVisible(isShow)
        this._left.$setVisible(isShow)
        this._right.$setVisible(isShow)
        this._btn.$setVisible(isShow)
        this._txCountdown.$setVisible(isShow)
        this._start.$setVisible(!isShow)
    }
    /**
     *  顶部爪子移动
     */
    private move (action: Actions):void {
        
        if (action === Actions.RIGHT || action === Actions.LEFT) { // 若为水平运动
            // 左移不能小于0  右边不能大于410
            if ((action === Actions.LEFT && this._position < 1) || (action === Actions.RIGHT && this._position > 510)) return
            let change:number = action === Actions.RIGHT ? this._step : -1 * this._step // 右移则为+
            this._position += change
            egret.Tween.get( this._top ).to({x: this._top.x + change }, 100, egret.Ease.sineIn )
            egret.Tween.get( this._line ).to({x: this._line.x + change }, 100, egret.Ease.sineIn )
            egret.Tween.get( this._zhuaMask ).to({x: this._zhuaMask.x + change }, 100, egret.Ease.sineIn )
            egret.Tween.get( this._zhua ).to({x: this._zhua.x + change }, 100, egret.Ease.sineIn )
            .call(() => {
                this.moveEnd(action) 
            })
        } else { // 若为垂直运动
            // 下移不能小于0  上移不能大于220
            if ((action === Actions.DOWN && this._positionY >= 0) || (action === Actions.UP && this._position <= -220)) return
            let change:number = action === Actions.UP ? -1 * this._step : this._step // 上移则为-
            this._positionY += change
            egret.Tween.get( this._zhuaMask ).to({y: this._zhuaMask.y + change }, 100, egret.Ease.sineIn )
            .call(() => {
                this.moveEnd(action) 
            })
        }
        
    }
    /**
     *  移动结束之后
     */
    private moveEnd (action: Actions):void {
        if (this._dot.parent) { // 若还在点击则继续移动
            setTimeout(() => {
                this.move(action)
            }, 30)
        }
        for (let mask of this._masks) {
            let x = mask.x + mask.width / 2
            let y = mask.y + mask.height / 2
            if (this._zhuaMask.hitTestPoint(x, y, true)) {
                // 若选中的阴影不是正好在娃娃阴影的上面 则将其挪到上面
                if (this.getChildIndex(this._zhua) - this.getChildIndex(mask) !== 1) {
                    let index = this.getChildIndex(mask)
                    this.setChildIndex(this._zhua, index)
                    this.setChildIndex(this._line, index)
                }
                return
            }
        }    
    } 
    /**
     *  回到初始化的位置
     */
    private back () {
        egret.Tween.get( this._top ).to({x: this._top.x - this._position }, 300, egret.Ease.sineIn )
        egret.Tween.get( this._line ).to({x: this._line.x - this._position }, 300, egret.Ease.sineIn )
        egret.Tween.get( this._zhuaMask ).to({x: this._zhuaMask.x - this._position, y: this._zhuaMask.y - this._positionY }, 300, egret.Ease.sineIn )
        egret.Tween.get( this._zhua ).to({x: this._zhua.x - this._position }, 300, egret.Ease.sineIn )
        .call(() => {
            // 重置位置
            this._position = 0;
            this._positionY = 0;
            // 换回爪子
            this._zhua.texture = RES.getRes('zhua1_png');
        })
    }

    /**
     * 初始化娃娃
     */
    private initToy () {
        for (let j = 0; j < 3; j++) {
            let num = j === 0 ? 3 : 4;
            let left = j === 0 ? 0 : (3 - j) * 40;
            for (let i = 0;i < num; i++) {
                let toy = this.createBitmapByName(`${this._wawaName}_png`)
                toy.width = 128
                toy.height = 176
                toy.x = 560 - i * 140 - left;
                toy.y = 650 - j * 100;
                // toy.rotation = Math.random() * 20 - 10
                toy.name = `toy_${i+1}_${j+1}`
                this.addChild(toy)
                this.setChildIndex(toy, 5) // 深度 刚好要在框框内
                this._toys.push(toy)

                let mask = new egret.Shape;
                mask.graphics.lineStyle( 0x000000 )
                mask.graphics.beginFill( 0x37516e, 0.2 );
                mask.graphics.drawEllipse( 0, 0, 100, 40 );
                mask.graphics.endFill();
                mask.x = 570 - i * 140 - left;
                mask.y = 800 - j * 100;
                mask.name = `mask_${i+1}_${j+1}`
                this.addChild(mask);
                this.setChildIndex(mask, 5) // 深度 刚好要在框框内
                this._masks.push(mask)
            }
        }

        this._zhuaMask.$setVisible(true);
    }

    /**
     *  点击事件
     */ 
    private touchHandler( evt:egret.TouchEvent ){
        switch ( evt.type ){
            case egret.TouchEvent.TOUCH_MOVE:
                this.checkCollision(evt.stageX, evt.stageY)
                // console.log('move', evt.stageX, evt.stageY)
                break;
            case egret.TouchEvent.TOUCH_BEGIN:
                this.stage.addEventListener( egret.TouchEvent.TOUCH_MOVE, this.touchHandler, this );
                this.stage.once( egret.TouchEvent.TOUCH_END, this.touchHandler, this );
                this.addChild( this._dot );
                this.checkCollision(evt.stageX, evt.stageY)
                this.directionClick(evt.stageX, evt.stageY)
                // console.log('begin', evt.stageX, evt.stageY)
                break;
            case egret. TouchEvent.TOUCH_END:
                this.stage.removeEventListener( egret.TouchEvent.TOUCH_MOVE, this.touchHandler, this );
                this.stage.addEventListener( egret.TouchEvent.TOUCH_BEGIN, this.touchHandler, this );
                if( this._dot.parent ){
                    this._dot.parent.removeChild( this._dot );
                }
                break;
        }
    }

    // 点
    private _dot:egret.Shape;
    private _up:egret.Bitmap;
    private _down:egret.Bitmap;
    private _left:egret.Bitmap;
    private _right:egret.Bitmap;
    private _btn:egret.Bitmap;

    private _top:egret.Bitmap;
    private _line:egret.Bitmap;
    private _zhua:egret.Bitmap;
    private _zhuaMask:egret.Shape;


    // 开始按钮
    private _start:egret.Bitmap;
    // 一堆娃娃
    private _toys:egret.Bitmap[] = [];  
    // 一堆阴影
    private _masks:egret.Shape[] = [];
    //
    /**
     * 创建游戏场景
     * Create a game scene
     */
    private createGameScene() {        

        this.stage.addEventListener( egret.TouchEvent.TOUCH_BEGIN, this.touchHandler, this );
        // 背景
        let bg = this.createBitmapByName("bg_png");
        bg.width = 646;
        bg.height = 728;
        bg.x = 52;
        bg.y = 130;
        bg.name = 'bg'
        this.addChild(bg);

        // 顶部
        this._top = this.createBitmapByName("top_png");
        this._top.name = 'top'
        this._top.width = 28;
        this._top.height = 18;
        this._top.x = 102;
        this._top.y = 130;
        this.addChild(this._top);

        // 线
        this._line = this.createBitmapByName("line_png");
        this._line.name = 'line'
        this._line.width = 12;
        this._line.height = 50;
        this._line.x = 110;
        this._line.y = 146;
        this.addChild(this._line);

        // 抓
        this._zhua = this.createBitmapByName("zhua1_png");
        this._zhua.name = 'zhua'
        this._zhua.width = 174;
        this._zhua.height = 190;
        this._zhua.x = 29;
        this._zhua.y = 191;
        this.addChild(this._zhua);

        this._zhuaMask = new egret.Shape;
        this._zhuaMask.name = 'zhuaMask'
        this._zhuaMask.graphics.beginFill( 0x37516e, 0.3 );
        this._zhuaMask.graphics.drawEllipse( 0, 0, 140, 70 );
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
        let exit = this.createBitmapByName("exit_png");
        exit.width = 210;
        exit.height = 204;
        exit.x = 52;
        exit.y = 654;
        exit.name = 'exit'
        this.addChild(exit);

        // 背景
        let dollbg = this.createBitmapByName("doll_bg_png");
        let stageW = this.stage.stageWidth;
        let stageH = this.stage.stageHeight;
        dollbg.width = 708;
        dollbg.height = 906;
        dollbg.x = 21;
        dollbg.name = 'dollbg'
        this.addChild(dollbg);
        
        // 方向键 上
        this._up = this.createBitmapByName("up_png");
        this._up.name = 'up'
        this._up.width = 90;
        this._up.height = 94;
        this._up.x = 160;
        this._up.y = 920;
        this._up.$setVisible(false);
        this.addChild(this._up);

        // 方向键 左
        this._left = this.createBitmapByName("left_png");
        this._left.name = 'left'
        this._left.width = 90;
        this._left.height = 94;
        this._left.x = 40;
        this._left.y = 980;
        this._left.$setVisible(false);
        this.addChild(this._left);

        // 方向键 右
        this._right = this.createBitmapByName("right_png");
        this._right.name = 'right'
        this._right.width = 90;
        this._right.height = 94;
        this._right.x = 280;
        this._right.y = 980;
        this._right.$setVisible(false);
        this.addChild(this._right);

        // 方向键 下
        this._down = this.createBitmapByName("down_png");
        this._down.name = 'down'
        this._down.width = 90;
        this._down.height = 94;
        this._down.x = 160;
        this._down.y = 1040;
        this._down.$setVisible(false);
        this.addChild(this._down);

        // 抓的按钮
        this._btn = this.createBitmapByName("btn_zhua_png");
        this._btn.name = 'btn_zhua'
        this._btn.width = 188;
        this._btn.height = 176;
        this._btn.x = 500;
        this._btn.y = 910;
        this._btn.$setVisible(false);
        this.addChild(this._btn);

        // 开始按钮
        this._start = this.createBitmapByName("btn_start_png");
        this._btn.name = 'btn_start'
        this._start.width = 342;
        this._start.height = 114;
        this._start.x = 204;
        this._start.y = 980;
        this.addChild(this._start);

        /// 小圆点，用以提示用户按下位置
        this._dot = new egret.Shape;
        this._dot.graphics.beginFill( 0x00ff00 );
        this._dot.graphics.drawCircle( 0, 0, 5 );
        this._dot.graphics.endFill();

        /// 提示信息
        this._txCountdown = new egret.TextField;
        this._txCountdown.name = 'text_countdown'
        this._txCountdown.size = 28;
        this._txCountdown.x = 570;
        this._txCountdown.y = 1090;
        this._txCountdown.textAlign = egret.HorizontalAlign.LEFT;
        this._txCountdown.textColor = 0xFFFFFF;
        this._txCountdown.type = egret.TextFieldType.DYNAMIC;
        this._txCountdown.lineSpacing = 6;
        this._txCountdown.multiline = true;
        this._txCountdown.text = this._time + 'S';
        this._txCountdown.$setVisible(false);
        this.addChild( this._txCountdown );
    }

    private countdown (time:number = 30) {
        this._txCountdown.text = time + 'S';
        setTimeout(() => {
            if (time > 0) { // 是否倒计时结束
                // 若已经抓了则不继续倒计时
                this._isCountdown && this.countdown(time - 1)
            } else {
                // 若结束则开始抓
                this._isCountdown = false
                this.toZhua()
            }
        }, 1000)
    }

    private _iTouchCollideStatus:number;
    private _bShapeTest:boolean;
    private launchCollisionTest():void {

        // this._iTouchCollideStatus = TouchCollideStatus.NO_TOUCHED;
        // this._bShapeTest = false;
        // this.stage.addEventListener( egret.TouchEvent.TOUCH_BEGIN, this.touchHandler, this );

        // this.updateInfo( TouchCollideStatus.NO_TOUCHED );
    }
    
    /**
     * 根据name关键字创建一个Bitmap对象。name属性请参考resources/resource.json配置文件的内容。
     * Create a Bitmap object according to name keyword.As for the property of name please refer to the configuration file of resources/resource.json.
     */
    private createBitmapByName(name: string) {
        let result = new egret.Bitmap();
        let texture: egret.Texture = RES.getRes(name);
        result.texture = texture;
        return result;
    }
}


