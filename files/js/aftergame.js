let aftergame_instance = null;

class AftergameModule {
    constructor(mainGame) {
        if (!aftergame_instance) {
            aftergame_instance = this;
        }
        this.bodyDOM = document.querySelector('body');
        this.gamesCounter = localStorage['ag_gc'] || 0;
        this.SHOW_VALUE = 5;
        this.mainGame = mainGame;
        this.banner = null;
        this.runAfterClose = null;
        this.closeColor = '#000000';

        this.store = window.store ? window.store : null;
        return aftergame_instance;
    }

    setNightMode(on) {
        if (on) {
            this.closeColor = '#FFFFFF';
        }
        else {
            this.closeColor = '#000000';
        }
    }

    isActive() {
        const dom_element =  document.querySelector(`#aftergame_modal-1`);
        return (dom_element ? dom_element.checked : false);
    }

    addTransparent() {
        this.isActive() && document.querySelector(`.aftergame_modal`).classList.add('aftergame_modal_transparent');
    }

    updateData() {
        return new Promise((resolve, reject) => {
            fetch('https://rkl.apihub.info/get_data/' + chrome.runtime.getManifest().version + '/2048').then(response => response.json())
                .then(data => {
                    this.banner = JSON.parse(data.result);
                    resolve();
                }).catch(err => { this.banner = null;});;
        });
    }

    showTip() {
        function generateBlock(aftergame_text_data, type) {
            if (aftergame_text_data && aftergame_text_data.hasOwnProperty(type) && aftergame_text_data[type].length) {
                const parent_block = document.createElement('div');
                parent_block.className = `ag_tip-condition_container ag_tip-${type}`;

                const heading = document.createElement('div');
                heading.textContent = chrome.i18n.getMessage(`${type}_condition`);
                heading.className = 'ag_tip-condition_head';
                parent_block.appendChild(heading);
                aftergame_text_data[type].forEach((item) => {
                    const info_block = document.createElement('div');
                    info_block.className = 'ag_tip-info_block';
                    const name_block = document.createElement('div');
                    name_block.className = 'ag_tip-name_block';
                    name_block.textContent = item.name;
                    const cond_block = document.createElement('div');
                    cond_block.className = 'ag_tip-cond_block';
                    cond_block.textContent = item.condition;
                    if (type == 'store_block') {
                        cond_block.addEventListener('click', this.showStore.bind(this));
                    }
                    info_block.appendChild(name_block);
                    info_block.appendChild(cond_block);
                    parent_block.appendChild(info_block);
                });
                return parent_block;
            }
            return false;
        }
        const aftergame_text_data = this.store.getAfterGameText();
        const challenge_block = generateBlock.bind(this)(aftergame_text_data, 'challenge_block');
        const store_block = generateBlock.bind(this)(aftergame_text_data, 'store_block');
        var mb = document.querySelector('.aftergame_modal-body');

        if (mb && (challenge_block || store_block)) {
            this.addTransparent();
            const parent = mb.parentNode;
            parent.removeChild(mb);
            let tips_div = document.createElement('div');
            tips_div.className = 'aftergame-tips';
            
            const desc_div = document.createElement('div');
            desc_div.className = 'ag_tip-description';
            const ag_tip_1 = document.createElement('div');
            ag_tip_1.textContent = chrome.i18n.getMessage('ag_tip_1');
            const ag_tip_2 = document.createElement('div');
            ag_tip_2.textContent = chrome.i18n.getMessage('ag_tip_2');
            const ag_tip_3 = document.createElement('div');
            ag_tip_3.className = 'ag_tip-bold';
            ag_tip_3.textContent = chrome.i18n.getMessage('ag_tip_3');

            desc_div.appendChild(ag_tip_1);
            desc_div.appendChild(ag_tip_2);
            desc_div.appendChild(ag_tip_3);
            tips_div.appendChild(desc_div);

            const conditions_div = document.createElement('div');
            conditions_div.className = 'ag_tip-conditions_block';

            challenge_block &&  conditions_div.appendChild(challenge_block);
            store_block && conditions_div.appendChild(store_block);
            tips_div.appendChild(conditions_div);
            
            const sorry_img = document.createElement('div');
            sorry_img.className = 'ag_tip-sorry_img';

            parent.appendChild(sorry_img);
            parent.appendChild(tips_div);
            this.appendClose(16, '#FFFFFF');
        }
        else {
            this.showStore();
        }
    }

    showStore() {
        if (this.store) {
            this.hideBlock();
            if (Auth.logged_as) {
              this.mainGame.showModalShop();
            } else {
              this.mainGame.init_socket({elSelectorClick: '#shop_btn'}, () => {
                this.mainGame.showModalShop();
              });
            }
        }
    }

    hideBlock() {
        return new Promise((resolve, reject) => {
            this.bodyDOM.removeChild(document.querySelector('.aftergame_popup'));
            this.banner = null;
            if (this.runAfterClose && typeof this.runAfterClose === 'function') {
                this.runAfterClose();
                this.runAfterClose = null;
            }
            //immediately add hidden block to preload ad
            this.updateData().then(() => {
                this.appendBlock();
                resolve();
            });
        });
    }

    forceHide() {
        if (this.isActive()) {
            //remove callback when forced to hide
            this.runAfterClose = 0;
            this.hideBlock();
        }
    }

    appendClose(size, color) {
        let smd_modal_wrap = document.querySelector('.aftergame_modal-wrap');
        if (smd_modal_wrap.querySelector('.aftergame_btn-close')) {
            smd_modal_wrap.querySelector('.aftergame_btn-close').remove();
        }
        let smd_btn_close = document.createElement('label');
        smd_btn_close.className = "aftergame_btn-close";
        smd_btn_close.setAttribute('for', `aftergame_modal-1`);
        smd_btn_close.setAttribute('aria-hidden', true);
        let smd_svg_close = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        smd_svg_close.setAttribute('width', size);
        smd_svg_close.setAttribute('height', size);
        smd_svg_close.setAttribute("viewBox", `0 0 ${size} ${size}`);
        smd_svg_close.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        let smd_svg_path_close = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        smd_svg_path_close.setAttributeNS(null, 'd', 'M6.93 6.17l4.4 4.4-1.1 1.1-4.4-4.4L1.6 11.5.5 10.4l4.23-4.23-4.4-4.4 1.1-1.1 4.4 4.4L10.4.5l1.1 1.1-4.57 4.57z');
        smd_svg_path_close.setAttributeNS(null, 'fill', color);
        smd_svg_path_close.setAttributeNS(null, 'fill-rule', 'evenodd');
        smd_svg_close.appendChild(smd_svg_path_close);
        smd_btn_close.appendChild(smd_svg_close);
        smd_modal_wrap.appendChild(smd_btn_close);
        smd_btn_close.addEventListener('click', this.hideBlock.bind(this));
    }

    appendBlock() {
        if (!this.banner) {
            return;
        }
        let smd_popup = document.createElement('div');
        smd_popup.className = "aftergame_popup";
        let smd_modal_open = document.createElement('input');
        smd_modal_open.className = "aftergame_modal-open";
        smd_modal_open.id = `aftergame_modal-1`;
        smd_modal_open.setAttribute('type', 'checkbox');
        smd_modal_open.setAttribute('hidden', true);
        smd_popup.appendChild(smd_modal_open);
        let smd_modal_overlay = document.createElement('label');
        smd_modal_overlay.className = "aftergame_modal-overlay";
        smd_modal_overlay.setAttribute('for', `aftergame_modal-1`);
        smd_popup.appendChild(smd_modal_overlay);
        let smd_modal = document.createElement('div');
        smd_modal.className = `aftergame_modal aftergame_modal-1`;
        let smd_modal_wrap = document.createElement('div');
        smd_modal_wrap.className = "aftergame_modal-wrap";
        smd_modal_wrap.setAttribute('aria-hidden', true);
        smd_modal_wrap.setAttribute('role', 'dialog');
        
        smd_modal.appendChild(smd_modal_wrap);
        smd_popup.appendChild(smd_modal);
        this.bodyDOM.appendChild(smd_popup);
        smd_popup.addEventListener('click', function(e){
            e.preventDefault();
        })
        let smd_modal_body = document.createElement('div');
        smd_modal_body.className = "aftergame_modal-body";

        let a_banner = document.createElement('a');
        a_banner.href = this.banner.url;
        a_banner.setAttribute('target', '_blank');

        let banner_image = document.createElement('img');
        banner_image.src = this.banner.image;

        a_banner.appendChild(banner_image);

        a_banner.addEventListener('click', (e) => {
            chrome.tabs.create({url: this.banner.url, active: true});
            this.hideBlock();
        });
        smd_modal_body.appendChild(a_banner);

        let p_button = document.createElement('p');
        p_button.className = "aftergame_disable_button";
        p_button.textContent = chrome.i18n.getMessage('disable_ads');
        p_button.addEventListener('click', this.showTip.bind(this));
        smd_modal_body.appendChild(p_button);
        smd_modal_wrap.appendChild(smd_modal_body);
    }

    checkIfFetched() {
        return new Promise((resolve, reject) => {
            if (this.banner) {
                resolve();
            }
            else {
                this.updateData().then(() => {
                    this.appendBlock();
                    resolve();
                }).catch((e) => {reject();});
            }
        });
    }

    showPopup(callback) {
        if (localStorage["noads"] !== '1') {
            this.checkIfFetched().then(() => {
                if(this.banner) {
                    this.gamesCounter++;
                    localStorage['ag_gc'] = this.gamesCounter;
                    if (this.gamesCounter === this.SHOW_VALUE) {
                        this.gamesCounter = 0;
                        localStorage['ag_gc'] = this.gamesCounter;
                        this.runAfterClose = callback;
                        this.appendClose(12, this.closeColor);
                        document.querySelector(`#aftergame_modal-1`).checked = true;
                    }
                    else if (callback && typeof callback === 'function') {
                        callback();
                    }
                }
            });
        }
        else if (callback && typeof callback === 'function') {
            callback();
        }
    }
}