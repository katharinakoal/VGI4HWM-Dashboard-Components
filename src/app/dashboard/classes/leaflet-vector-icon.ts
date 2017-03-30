import * as L from 'leaflet';

export class LeafletVectorIcon extends L.Icon {

    private _mapPin = 'M12 10c0-2.203-1.797-4-4-4s-4 1.797-4 4 1.797 4 4 4 4-1.797 4-4zM16 10c0 0.953-0.109 1.937-0.516 2.797l-5.688 12.094c-0.328 0.688-1.047 1.109-1.797 1.109s-1.469-0.422-1.781-1.109l-5.703-12.094c-0.406-0.859-0.516-1.844-0.516-2.797 0-4.422 3.578-8 8-8s8 3.578 8 8z';
    private _iconOptions = {
        iconSize: [ 30, 50 ],
        iconAnchor: [ 15, 50 ],
        popupAnchor: [ 2, -40 ],
        shadowAnchor: [ 39, 45 ],
        shadowSize: [ 54, 51 ],
        className: 'vector-marker',
        markerColor: '#76b900',
        viewBox: '1 -2 14 30',
    };

    constructor(options?) {
        super(options);
        L.Util.setOptions(this, this._iconOptions);
        L.Util.setOptions(this, options);
    }

    createIcon(oldIcon) {
        const div = (oldIcon && oldIcon.tagName === 'DIV' ? oldIcon : document.createElement('div'));
        const options: any = this.options;

        div.innerHTML = `<svg 
            width="${options.iconSize[0]}px" 
            height="${options.iconSize[1]}px" 
            viewBox="${this._iconOptions.viewBox}" 
            version="1.1" 
            xmlns="http://www.w3.org/2000/svg" 
            xmlns:xlink="http://www.w3.org/1999/xlink">
            <path d="${this._mapPin}" fill="${options.markerColor}"></path>
        </svg>`;

        this._setIconStyles(div, 'icon');
        this._setIconStyles(div, `icon-${options.markerColor}`);
        return div;
    }

    createShadow() {
        const div = document.createElement('div');
        this._setIconStyles(div, 'shadow');
        return div;
    }

    _setIconStyles(img, name) {
        const options = this.options;
        const size = L.point(options[(name === 'shadow' ? 'shadowSize' : 'iconSize')]);
        let anchor = void 0;

        if (name === 'shadow') {
            anchor = L.point(options.shadowAnchor || options.iconAnchor);
        } else {
            anchor = L.point(options.iconAnchor);
        }
        if (!anchor && size) {
            anchor = size.divideBy(2);
        }
            img.className = 'vector-marker-' + name + ' ' + options.className;
        if (anchor) {
            img.style.marginLeft = (-anchor.x) + 'px';
            img.style.marginTop = (-anchor.y) + 'px';
        }
        if (size) {
            img.style.width = size.x + 'px';
            img.style.height = size.y + 'px';
        }
    }

}
