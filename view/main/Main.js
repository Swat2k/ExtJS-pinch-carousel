Ext.define('PinchGallery.view.main.Main', {
    extend: 'Ext.Container',
    xtype: 'app-main',
    controller: 'main',
    viewModel: 'main',
    requires: [
        'PinchGallery.core.CarouselPinch'
    ],
    layout:'hbox',
    items: [
        {
            xtype: 'container',
            width: '10%',
            html: 'left bar test'
        }, {
            xtype: 'carouselpinch',
            flex:1,
            items: [
                {
                    xtype: 'core.imageviewer',
                    fileName: 'Bonsai_IMG_6425.jpg',
                    imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/0/07/Bonsai_IMG_6425.jpg'
                },
                {
                    xtype: 'core.imageviewer',
                    fileName: 'Bonsai_IMG_6426.jpg',
                    imageSrc: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Bonsai_IMG_6426.jpg'
                }

            ],
            listeners: {
                close: function (component, scope) {
                    alert('close');
                },
                download: function (component, activeItem, url, fileName) {
                    alert('download');
                },
                rotate: function (component, activeItem, rotateMode) {
                    alert('rotate');
                }
            }
        }, {
            xtype: 'container',
            width: '10%',
            html: 'right bar test'
        }
    ]

});
