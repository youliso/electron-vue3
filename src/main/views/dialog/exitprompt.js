'use strict';
const path = require('path');
module.exports = {
    size:[],
    lib: [],
    main: {
        data() {
            return {
                listData: []
            }
        },
        template: `<div class="subclass">
           <h4>是否最小化到托盘?</h4>
           <button @click="closed(0)" class="button">确定</button>
           <button @click="closed(1)" class="button">取消</button>
        </div>`,
        created() {
        },
        beforeDestroy() {
            //卸载
        },
        activated() {
            //开启缓存后 切换加载
        },
        deactivated() {
            //开启缓存后 切换卸载
        },
        methods: {
            closed(is) {
                if (is === 1) this.$util.ipcRenderer.send('closed')
                else this.$util.ipcRenderer.send('hide')
            }
        }
    }
};