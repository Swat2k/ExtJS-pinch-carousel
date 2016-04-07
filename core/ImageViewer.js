Ext.define('PinchGallery.core.ImageViewer', {
    extend: 'Ext.Container',
    xtype: 'core.imageviewer',
    alias: 'widget.core.imageviewer',

    isScaled: false,
    headerToolbarHeight: 0,
    rotate: 0,
    fileName: '',

    config: {
        doubleTapScale: 1,
        maxScale: 4,
        loadingMask: true,
        previewSrc: false,
        resizeOnLoad: true,
        imageSrc: false,
        initOnActivate: false,
        Rotate: 0,
        cls: 'imageBox',
        scrollable: 'both',
        loadingMessage: 'Загрузка ...',
        html: '<figure><img></figure>',
        errorImage: false
    },

    duringDestroy: false,

    initialize: function () {
        var me = this;

        if (me.getInitOnActivate()) {
            me.on('activate', me.initViewer, me, {
                delay: 1,
                single: true
            });
        } else {
            me.on('painted', me.initViewer, me, {
                delay: 1,
                single: true
            });
        }
    },

    getFileName: function () {
        var me = this;
        return me.fileName;
    },

    initViewer: function () {
        var me = this,
            scroller = me.getScrollable(),
            element = me.element;

        //disable scroller
        scroller.setDisabled(true);

        // mask image viewer
        if (me.getLoadingMask()) {
            me.setMasked({
                xtype: 'loadmask',
                message: me.getLoadingMessage()
            });
        }

        // retrieve DOM els
        me.figEl = element.down('figure');
        me.imgEl = me.figEl.down('img');

        // apply required styles
        me.figEl.setStyle({
            overflow: 'hidden',
            display: 'block',
            margin: 0
        });

        me.imgEl.setStyle({
            '-webkit-user-drag': 'none',
            '-webkit-transform-origin': '0 0',
            '-webkit-backface-visibility': 'hidden',
            '-webkit-perspective': '1000',
            'visibility': 'hidden'
        });

        // show preview
        if (me.getPreviewSrc()) {
            element.setStyle({
                backgroundImage: 'url(' + me.getPreviewSrc() + ')',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                webkitBackgroundSize: 'contain'
            });
        }

        // attach event listeners
        me.on('load', me.onImageLoad, me);
        me.imgEl.addListener({
            scope: me,
            doubletap: me.onDoubleTap,
            pinchstart: me.onImagePinchStart,
            pinch: me.onImagePinch,
            pinchend: me.onImagePinchEnd
        });

        // load image
        if (me.getImageSrc()) {
            me.loadImage(me.getImageSrc());
        }
    },

    getFullImageSrc: function () {
        var me = this,
            src = me.getImageSrc();

        if (me.up().getServerRotateSupport())
            return src + '&rotate=' + me.rotate;
        else
            return src;
    },

    refreshImage: function () {
        var me = this,
            src = me.getImageSrc();

        // mask image viewer
        if (me.getLoadingMask()) {
            me.setMasked({
                xtype: 'loadmask',
                message: me.getLoadingMessage()
            });
        }

        me.loadImage(src);
    },

    loadImage: function (src) {
        var me = this;
        if (me.imgEl) {
            me.imgEl.dom.src = me.getFullImageSrc();
            me.imgEl.dom.onload = Ext.Function.bind(me.onLoad, me, me.imgEl, 0);
            if (me.getErrorImage()) {
                me.imgEl.dom.onerror = function () {
                    this.src = me.getErrorImage();
                };
            }
        } else {
            me.setImageSrc(me.getFullImageSrc());
        }
    },

    unloadImage: function () {
        var me = this;

        // mask image viewer
        if (me.getLoadingMask()) {
            me.setMasked({
                xtype: 'loadmask',
                message: me.getLoadingMessage()
            });
        }

        if (me.imgEl) {
            me.imgEl.dom.src = '';
            me.imgEl.setStyle({ visibility: 'hidden' });
        } else {
            me.setImageSrc('');
            me.imgEl.setStyle({ visibility: 'hidden' });
        }
    },

    onLoad: function (el, e) {
        var me = this;
        me.fireEvent('load', me, el, e);
    },

    onImageLoad: function () {
        var me = this,
            parentElement = me.parent.element;

        // get viewport size
        me.viewportWidth = me.viewportWidth || me.getWidth() || parentElement.getWidth();
        me.viewportHeight = me.viewportHeight || me.getHeight() || parentElement.getHeight();

        // grab image size
        me.imgWidth = me.imgEl.dom.width;
        me.imgHeight = me.imgEl.dom.height;

        // calculate and apply initial scale to fit image to screen
        if (me.getResizeOnLoad()) {
            me.scale = me.baseScale = Math.min(me.viewportWidth / me.imgWidth, me.viewportHeight / me.imgHeight);
            me.setMaxScale(me.scale * 4);
        } else {
            me.scale = me.baseScale = 1;
        }

        // calc initial translation
        var tmpTranslateX = (me.viewportWidth - me.baseScale * me.imgWidth) / 2,
            tmpTranslateY = (me.viewportHeight - me.baseScale * me.imgHeight) / 2;

        // set initial translation to center
        me.setTranslation(tmpTranslateX, tmpTranslateY);
        me.translateBaseX = me.translateX;
        me.translateBaseY = me.translateY;

        me.resize();

        // apply initial scale and translation
        me.applyTransform();

        // initialize scroller configuration
        me.adjustScroller();

        // show image and remove mask
        me.imgEl.setStyle({
            visibility: 'visible'
        });

        // remove preview
        if (me.getPreviewSrc()) {
            me.element.setStyle({
                backgroundImage: 'none'
            });
        }

        if (me.getLoadingMask()) {
            me.setMasked(false);
        }

        me.fireEvent('imageLoaded', me);
    },

    onImagePinchStart: function (ev) {
        var me = this,
            scroller = me.getScrollable(),
            scrollPosition = scroller.position,
            touches = ev.touches,
            element = me.element,
            scale = me.scale;

        // disable scrolling during pinch
        scroller.stopAnimation();
        scroller.setDisabled(true);

        // store beginning scale
        me.startScale = scale;

        // calculate touch midpoint relative to image viewport
        me.originViewportX = (touches[0].pageX + touches[1].pageX) / 2 - element.getX();
        me.originViewportY = (touches[0].pageY + touches[1].pageY) / 2 - element.getY();

        // translate viewport origin to position on scaled image
        me.originScaledImgX = me.originViewportX + scrollPosition.x - me.translateX;
        me.originScaledImgY = me.originViewportY + scrollPosition.y - me.translateY;

        // unscale to find origin on full size image
        me.originFullImgX = me.originScaledImgX / scale;
        me.originFullImgY = me.originScaledImgY / scale;

        // calculate translation needed to counteract new origin and keep image in same position on screen
        me.translateX += (-1 * ((me.imgWidth * (1 - scale)) * (me.originFullImgX / me.imgWidth)));
        me.translateY += (-1 * ((me.imgHeight * (1 - scale)) * (me.originFullImgY / me.imgHeight)));

        // apply new origin
        me.setOrigin(me.originFullImgX, me.originFullImgY);

        // apply translate and scale CSS
        me.applyTransform();
    },

    onImagePinch: function (ev) {
        var me = this;

        // prevent scaling to smaller than screen size
        me.scale = Ext.Number.constrain(ev.scale * me.startScale, me.baseScale - 2, me.getMaxScale());
        me.applyTransform();
    },

    onImagePinchEnd: function (ev) {
        var me = this;

        // set new translation
        if (me.scale == me.baseScale) {
            // move to center
            me.setTranslation(me.translateBaseX, me.translateBaseY);
            me.isScaled = false;
        } else {
            //Resize to init size like ios
            if (me.scale < me.baseScale && me.getResizeOnLoad()) {
                me.resetZoom();
                return;
            }
            // calculate rescaled origin
            me.originReScaledImgX = me.originScaledImgX * (me.scale / me.startScale);
            me.originReScaledImgY = me.originScaledImgY * (me.scale / me.startScale);

            // maintain zoom position
            me.setTranslation(me.originViewportX - me.originReScaledImgX, me.originViewportY - me.originReScaledImgY);
            me.isScaled = true;
        }
        // reset origin and update transform with new translation
        me.setOrigin(0, 0);
        me.applyTransform();

        // adjust scroll container
        me.adjustScroller();
    },

    onZoomIn: function () {
        var me = this,
            ev = {
                pageX: 0,
                pageY: 0
            },
            myScale = me.scale;

        if (myScale < me.getMaxScale()) {
            myScale = me.scale + 0.05;
        }

        if (myScale >= me.getMaxScale()) {
            myScale = me.getMaxScale();
        }

        ev.pageX = me.viewportWidth / 2;
        ev.pageY = me.viewportHeight / 2;

        me.zoomImage(ev, myScale);
    },

    onZoomOut: function () {
        var me = this,
            ev = {
                pageX: 0,
                pageY: 0
            },
            myScale = me.scale;

        if (myScale > me.baseScale) {
            myScale = me.scale - 0.05;
        }

        if (myScale <= me.baseScale) {
            myScale = me.baseScale;
        }

        ev.pageX = me.viewportWidth / 2;
        ev.pageY = me.viewportHeight / 2;

        me.zoomImage(ev, myScale);
    },

    zoomImage: function (ev, scale, scope) {
        var me = this,
            scroller = me.getScrollable(),
            scrollPosition = scroller.position,
            element = me.element;

        // zoom in toward tap position
        var oldScale = me.scale,
            newScale = scale,
            originViewportX = ev ? (ev.pageX - element.getX()) : 0,
            originViewportY = ev ? (ev.pageY - element.getY()) : 0,
            originScaledImgX = originViewportX + scrollPosition.x - me.translateX,
            originScaledImgY = originViewportY + scrollPosition.y - me.translateY,
            originReScaledImgX = originScaledImgX * (newScale / oldScale),
            originReScaledImgY = originScaledImgY * (newScale / oldScale);

        me.scale = newScale;
        setTimeout(function () {
            me.setTranslation(originViewportX - originReScaledImgX, originViewportY - originReScaledImgY);
            // reset origin and update transform with new translation
            //that.setOrigin(0, 0);

            // reset origin and update transform with new translation
            me.applyTransform();

            // adjust scroll container
            me.adjustScroller();

            // force repaint to solve occasional iOS rendering delay
            //Ext.repaint();
        }, 50);
    },

    onDoubleTap: function (ev, t) {
        var me = this,
            scroller = me.getScrollable(),
            scrollPosition = scroller.position,
            element = me.element;

        if (!me.getDoubleTapScale()) {
            return false;
        };

        // set scale and translation
        if (me.scale > me.baseScale) {
            // zoom out to base view
            me.scale = me.baseScale;
            me.setTranslation(me.translateBaseX, me.translateBaseY);
            // reset origin and update transform with new translation
            me.applyTransform();

            // adjust scroll container
            me.adjustScroller();
        } else {

            var oldScale = me.scale,
                newScale = me.baseScale * 4,
                originViewportX = ev ? (ev.pageX - element.getX()) : 0,
                originViewportY = ev ? (ev.pageY - element.getY()) : 0,

                originScaledImgX = originViewportX + scrollPosition.x - me.translateX,
                originScaledImgY = originViewportY + scrollPosition.y - me.translateY,

                originReScaledImgX = originScaledImgX * (newScale / oldScale),
                originReScaledImgY = originScaledImgY * (newScale / oldScale);

            me.scale = newScale;

            //smoothes the transition
            setTimeout(function () {

                me.setTranslation(originViewportX - originReScaledImgX, originViewportY - originReScaledImgY);

                // reset origin and update transform with new translation
                me.applyTransform();


                me.updateTranslation();

                // adjust scroll container
                me.adjustScroller(true);

                // force repaint to solve occasional iOS rendering delay
                // Ext.repaint();
            }, 50);
        }

        me.isScaled = !(me.isScaled);
    },

    updateTranslation: function () {
        var me = this,
            scroller = me.getScrollable();

        this.applyTransform();
    },

    setOrigin: function (x, y) {
        this.imgEl.dom.style.webkitTransformOrigin = x + 'px ' + y + 'px';
    },

    setTranslation: function (translateX, translateY) {
        var me = this;

        me.translateX = translateX;
        me.translateY = translateY;

        // transfer negative translations to scroll offset
        me.scrollX = me.scrollY = 0;

        if (me.translateX < 0) {
            me.scrollX = me.translateX;
            me.translateX = 0;
        }
        if (me.translateY < 0) {
            me.scrollY = me.translateY;
            me.translateY = 0;
        }
    },

    resetZoom: function () {
        var me = this;

        if (me.duringDestroy) {
            return;
        }

        //Resize to init size like ios
        me.scale = me.baseScale;

        me.setTranslation(me.translateBaseX, me.translateBaseY);

        // reset origin and update transform with new translation
        me.setOrigin(0, 0);
        me.applyTransform();

        // adjust scroll container
        me.adjustScroller();
        me.isScaled = false;
    },

    resize: function () {
        var me = this,
            toolbar = me.up('#toolbar');

        // get viewport size
        me.viewportWidth = me.parent.element.getWidth() || me.viewportWidth || me.getWidth();
        me.viewportHeight = me.parent.element.getHeight() || me.viewportHeight || me.getHeight();

        me.origW = me.viewportWidth,
        me.origH = me.viewportHeight;

        if (!Ext.isEmpty(toolbar))
            me.viewportHeight -= toolbar.el.getHeight();

        me.viewportHeight -= me.parent.getIndicator().el.getHeight();

        // grab image size
        me.imgWidth = me.imgEl.dom.width;
        me.imgHeight = me.imgEl.dom.height;

        // calculate and apply initial scale to fit image to screen
        if (me.getResizeOnLoad()) {
            me.scale = me.baseScale = Math.min(me.viewportWidth / me.imgWidth, me.viewportHeight / me.imgHeight);
            me.setMaxScale(me.scale * 4);
        } else {
            me.scale = me.baseScale = 1;
        }

        switch (me.getRotate()) {
            case 90:
            case -270:
                me.scale = me.baseScale = Math.min(me.viewportWidth / me.imgHeight, me.viewportHeight / me.imgWidth);
                me.setMaxScale(me.scale * 4);
                me.translateX = me.translateBaseX = (me.viewportWidth + me.baseScale * me.imgHeight) / 2;
                me.translateY = me.translateBaseY = (me.viewportHeight - me.baseScale * me.imgWidth) / 2;
                break;
            case 180:
            case -180:
                me.translateX = me.translateBaseX = (me.viewportWidth + me.baseScale * me.imgWidth) / 2;
                me.translateY = me.translateBaseY = (me.viewportHeight + me.baseScale * me.imgHeight) / 2;
                break;
            case 270:
            case -90:
                me.scale = me.baseScale = Math.min(me.viewportWidth / me.imgHeight, me.viewportHeight / me.imgWidth);
                me.setMaxScale(me.scale * 4);
                me.translateX = me.translateBaseX = (me.viewportWidth - me.baseScale * me.imgHeight) / 2;
                me.translateY = me.translateBaseY = (me.viewportHeight + me.baseScale * me.imgWidth) / 2;
                break;
            default:
                // set initial translation to center
                me.translateX = me.translateBaseX = (me.viewportWidth - me.baseScale * me.imgWidth) / 2;
                me.translateY = me.translateBaseY = (me.viewportHeight - me.baseScale * me.imgHeight) / 2;
                break;
        }

        // apply initial scale and translation
        me.applyTransform();

        // initialize scroller configuration
        me.adjustScroller();
    },

    applyTransform: function () {
        var me = this,
            fixedX = Ext.Number.toFixed(me.translateX, 5),
            fixedY = Ext.Number.toFixed(me.translateY, 5),
            fixedScale = Ext.Number.toFixed(me.scale, 8),
            rotate = me.getRotate();

        me.imgEl.dom.style.webkitTransform = 'translate3d(' + fixedX + 'px, ' + fixedY + 'px, 0)' + ' scale3d(' + fixedScale + ',' + fixedScale + ',1) rotate(' + rotate + 'deg)';
    },

    adjustScroller: function (isDoubleTap) {
        var me = this,
            scroller = me.getScrollable(),
            scale = me.scale;

        // disable scrolling if zoomed out completely, else enable it
        if (scale === me.baseScale) {
            scroller.setDisabled(true);
            if ('hideIndicators' in scroller)
                scroller.hideIndicators();

        } else {
            scroller.setDisabled(false);
            if ('showIndicators' in scroller)
                scroller.showIndicators();
        }

        switch (me.getRotate()) {
            case 90:
            case -270:
            case -90:
            case 270:
                var boundWidth = Math.max(me.imgHeight * scale + 2 * me.translateY, me.viewportHeight);
                var boundHeight = Math.max(me.imgWidth * scale + 2 * me.translateX, me.viewportWidth);
                break;
            case 180:
            case -180:
            default:
                var boundWidth = Math.max(me.imgWidth * scale + 2 * me.translateX, me.viewportWidth);
                var boundHeight = Math.max(me.imgHeight * scale + 2 * me.translateY, me.viewportHeight);
                break;
        }

        me.figEl.setStyle({
            width: boundWidth + 'px',
            height: boundHeight + 'px'
        });

        // update scroller to new content size
        scroller.refresh();

        // apply scroll
        var x = 0;
        if (me.scrollX) {
            x = me.scrollX;
        }

        var y = 0;
        if (me.scrollY) {
            y = me.scrollY;
        }

        scroller.doScrollTo(Math.round(-1 * x), Math.round(-1 * y), false, true);
    },

    destroy: function () {
        var me = this;

        me.duringDestroy = true;

        me.un('activate', me.initViewer, me);
        me.un('painted', me.initViewer, me);

        Ext.destroy(me.getScrollable(), me.imgEl);

        me.callParent();
    }
});