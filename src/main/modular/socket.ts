import { ipcMain } from 'electron';
import Global from './global';
import Window from './window';
import { isNull } from '@/lib';
import { io, Socket as SocketIo } from 'socket.io-client';
import { ManagerOptions } from 'socket.io-client/build/manager';
import { SocketOptions } from 'socket.io-client/build/socket';

const { socketUrl } = require('@/cfg/index.json');


export enum SOCKET_MSG_TYPE {
  ERROR,
  SUCCESS,
  INIT,
  CLOSE
}

/**
 * Socket模块
 * */
export class Socket {
  public io: SocketIo;

  /**
   * socket.io参数
   * 参考 ManagerOptions & SocketOptions
   * url https://socket.io/docs/v3/client-api/#new-Manager-url-options
   */
  public opts: Partial<ManagerOptions & SocketOptions> = {
    auth: {
      authorization: Global.sharedObject['authorization']
    }
  };

  constructor() {
  }

  /**
   * 开启通讯
   */
  open(callback: Function) {
    this.io = io(socketUrl, this.opts);
    this.io.on('connect', () => {
      console.log('[Socket]connect');
    });
    this.io.on('disconnect', () => {
      console.log('[Socket]disconnect');
    });
    this.io.on('message', (data: { key: string; value: any; }) => callback(data));
    this.io.on('error', (data: any) => console.log(`[Socket]error ${data.toString()}`));
    this.io.on('close', () => console.log('[Socket]close'));
  }

  /**
   * 重新连接
   */
  reconnection() {
    if (this.io && this.io.io._readyState === 'closed') this.io.open();
  }

  /**
   * 关闭
   */
  close() {
    if (this.io && this.io.io._readyState !== 'closed') this.io.close();
  }

  /**
   * 发送
   */
  send(args: any) {
    if (this.io && this.io.io._readyState !== 'closed') this.io.send(args);
  }

  /**
   * 开启监听
   */
  on() {
    //设置opts
    ipcMain.on('socket-setopts', async (event, args) => this.opts = args);
    //重新连接
    ipcMain.on('socket-reconnection', async () => this.reconnection());
    //关闭
    ipcMain.on('socket-close', async () => this.close());
    //打开socket
    ipcMain.on('socket-open', async () => {
      if (isNull(this.io)) this.open((data: { key: string; value: any; }) => Window.send('socket-back', data));
    });
    //发送消息
    ipcMain.on('socket-send', (event, args) => this.send(args));
  }

}
