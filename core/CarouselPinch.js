Ext.define('PinchGallery.core.CarouselPinch', {
    extend: 'Ext.carousel.Carousel',
    xtype : 'carouselpinch',
    cls   : 'carouselpinch',
    requires: [
        'PinchGallery.core.ImageViewer'
    ],
    config: {
        isToolbarVisible: true,
        serverRotateSupport: false,
        downloadImageSupport: true,
        isCounterVisible: true
    },
    page: 1,
    pageTotal: 0,
    listeners: {
        add: function (component, item, index, eOpts) {
            component.pageTotal++;
            component.updatePageCount(component);
        },
        activeitemchange: function (container, value, oldValue, eOpts) {
            if (oldValue) {
                oldValue.resetZoom();
                this.getActiveItem().resize();
            }
        },
        resize: function (component, eOpts) {
            this.component.getActiveItem().resize();
        },
        initialize: function (component, eOpts) {
            var me = this,
                isServerRotateSupport = component.getServerRotateSupport();

            // Add toolbar with buttons if neccesary
            if (component.getIsToolbarVisible()) {
                component.add({
                    xtype : 'toolbar',
                    docked: 'top',
                    cls   : 'toolbar',
                    itemId: 'toolbar',
                    items: [
                        {
                            xtype: 'button',
                            cls: 'carouselpinch-button',
                            hidden: !isServerRotateSupport,
                            iconCls: 'x-fa fa-undo',
                            handler: function (button) {
                                var activeItem = component.getActiveItem();
                                activeItem.rotate++;
                                if (activeItem.rotate < -3 || activeItem.rotate > 3)
                                    activeItem.rotate = 0;

                                // refresh image
                                activeItem.refreshImage();

                                component.fireEvent('rotate', component, activeItem, activeItem.rotate);
                            }
                        },
                        {
                            xtype: 'button',
                            cls: 'carouselpinch-button',
                            iconCls: 'x-fa fa-repeat',
                            hidden: !isServerRotateSupport,
                            handler: function (button) {
                                var activeItem = component.getActiveItem();
                                activeItem.rotate--;
                                if (activeItem.rotate < -3 || activeItem.rotate > 3)
                                    activeItem.rotate = 0;

                                // refresh image
                                activeItem.refreshImage();

                                component.fireEvent('rotate', component, activeItem, activeItem.rotate);
                            }
                        },
                        {
                            xtype: 'button',
                            cls: 'carouselpinch-button',
                            iconCls: 'x-fa fa-download',
                            hidden: !(component.getDownloadImageSupport()),
                            handler: function (button) {
                                var activeItem = component.getActiveItem(),
                                    url = activeItem.getFullImageSrc(),
                                    fileName = activeItem.getFileName();

                                component.fireEvent('download', component, activeItem, url, fileName);
                            }
                        },
                        {
                            xtype: 'spacer'
                        },
                        {
                            xtype: 'container',
                            cls: 'carouselpinch-counter',
                            itemId: 'counter',
                            hidden: !(component.getIsCounterVisible())
                        },
                        {
                            xtype: 'button',
                            cls: 'carouselpinch-button',
                            iconCls: 'x-fa fa-times-circle',
                            handler: function (scope) {
                                component.fireEvent('close', component, scope);
                            }
                        }
                    ]
                });
                me.updatePageCount(component);
            }

        }
    },

    onDragStart: function (e) {
        var scroller = this.getActiveItem().getScrollable(),
            carousel = Ext.get(e.currentTarget.getAttribute('id')).component,
            imageViewer = carousel.getActiveItem();

        if (e.parentEvent.touches.length === 1 && (e.deltaX < 0 && scroller.getMaxPosition().x === scroller.position.x) || (e.deltaX > 0 && scroller.position.x === 0) || !imageViewer.isScaled) {
            this.callParent(arguments);
        }
    },
    onDrag: function (e) {
        if (e.parentEvent.touches.length === 1)
            this.callParent(arguments);
    },

    onDragEnd: function (e) {
        if (e.parentEvent.touches.length < 2)
            this.callParent(arguments);
    },

    onAnimationEnd: function () {
        var me = this,
            lastActiveIndex = this.getActiveIndex();

        this.callParent(arguments);

        var currentActiveIndex = this.getActiveIndex();

        if (currentActiveIndex > lastActiveIndex) {
            me.page += 1;
            me.updatePageCount(me);
        };

        if (currentActiveIndex < lastActiveIndex) {
            me.page -= 1;
            me.updatePageCount(me);
        };


    },

    updatePageCount: function (carousel) {
        var me = this,
            innerItems = carousel.getInnerItems(),
            counter = carousel.down('#counter');

        if (me.getIsCounterVisible() && me.getIsCounterVisible())
            counter.setHtml(carousel.page + '/' + innerItems.length);
    }

});

