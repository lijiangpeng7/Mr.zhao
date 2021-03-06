//app.js
const util = require("./utils/util.js");
const api = require("./api/index.js");
var app = getApp();
const Storage = {
  //  第一个 key 参数可以省略，直接传递 obj 对象，支持 callback
  setItem: function(key, obj, callback) {
    const getType = function(a) {
      var typeArray = Object.prototype.toString.call(a).split(" ");
      return typeArray[1].slice(0, -1);
    };
    var firstParamType = getType(arguments[0]);
    if (firstParamType === "Object") {
      var keyArrayLength = Object.keys(arguments[0]).length;
      var index = 0;
      for (var keyName in arguments[0]) {
        index++;
        wx.setStorage({
          key: keyName,
          data: arguments[0][keyName],
          success: index == keyArrayLength ? arguments[1] : function() {}
        });
      }
    }
    if (firstParamType === "String") {
      wx.setStorage({
        key: key,
        data: obj,
        success: callback || function() {}
      });
    }
  },
  getItem: function(key) {
    return wx.getStorageSync(key);
  },
  removeItem: function(key) {
    wx.removeStorage({
      key: key
    });
  }
};

var Event = (function() {
  var clientList = {},
    pub,
    sub,
    remove;

  var cached = {};

  sub = function(key, fn) {
    if (!clientList[key]) {
      clientList[key] = [];
    }
    // 使用缓存执行的订阅不用多次调用执行
    cached[key + "time"] == undefined ? clientList[key].push(fn) : "";
    if (cached[key] instanceof Array && cached[key].length > 0) {
      //说明有缓存的 可以执行
      fn.apply(null, cached[key]);
      cached[key + "time"] = 1;
    }
  };
  pub = function() {
    var key = Array.prototype.shift.call(arguments),
      fns = clientList[key];
    if (!fns || fns.length === 0) {
      //初始默认缓存
      cached[key] = Array.prototype.slice.call(arguments, 0);
      return false;
    }

    for (var i = 0, fn; (fn = fns[i++]); ) {
      // 再次发布更新缓存中的 data 参数
      cached[key + "time"] != undefined
        ? (cached[key] = Array.prototype.slice.call(arguments, 0))
        : "";
      fn.apply(this, arguments);
    }
  };
  remove = function(key, fn) {
    var fns = clientList[key];
    // 缓存订阅一并删除
    var cachedFn = cached[key];
    if (!fns && !cachedFn) {
      return false;
    }
    if (!fn) {
      fns && (fns.length = 0);
      cachedFn && (cachedFn.length = 0);
    } else {
      if (cachedFn) {
        for (var m = cachedFn.length - 1; m >= 0; m--) {
          var _fn_temp = cachedFn[m];
          if (_fn_temp === fn) {
            cachedFn.splice(m, 1);
          }
        }
      }
      for (var n = fns.length - 1; n >= 0; n--) {
        var _fn = fns[n];
        if (_fn === fn) {
          fns.splice(n, 1);
        }
      }
    }
  };
  return {
    pub: pub,
    sub: sub,
    remove: remove
  };
})();
App({
  data: {
    id: 0
  },
  onLaunch: function(e) {
    // 展示本地存储能力
    var logs = wx.getStorageSync("logs") || [];
    console.log("wx-----------------------------");
    console.log(wx);

    logs.unshift(Date.now());
    wx.setStorageSync("logs", logs);
    wx.setStorageSync("closeYouhuoquan", "close");

    // 注册发布订阅模式
    wx.yue = Event;
    // 注册 storage
    wx.Storage = Storage;
    // 把腾讯地图的 key 放在这里
    wx.mapKey = "2WZBZ-WLTKR-YNCWP-WFPIR-PEKJE-P2BSS";

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    });
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting["scope.userInfo"]) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo;

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res);
              }
            }
          });
        }
      }
    });
  },
  toIndex() {
    wx.switchTab({
      url: "../index/index"
    });
  },
  // 返回上一页
  returnLastPage() {
    wx.navigateBack({
      delta: 1
    });
  },
  isLogin(callback, e) {
    let token = wx.Storage.getItem("token");
    if (token === "") {
      wx.navigateTo({
        url: `../authorizationLogin/authorizationLogin?isShouquan=false`
      });
      // wx.showToast({
      //     title: '请您先授权登录...',
      //     icon: 'none',
      //     duration: 1000,
      //     complete: function() {
      //         setTimeout(() => {
      //             wx.navigateTo({
      //                 url: `../authorizationLogin/authorizationLogin?isShouquan=false`
      //             });
      //         }, 1000)
      //     }
      // })
    } else {
      // 登录后操作
      callback.apply(undefined, e);
    }
  },
  setHeight(callback) {
    const sysInfo = wx.getSystemInfoSync(); // 设备信息
    const winHeight = sysInfo.windowHeight; // 设备高度
    const screenHeight = sysInfo.screenHeight;
    // console.log(screenHeight)
    callback(winHeight);
  },
  globalData: {
    userInfo: null
  },
  share() {
    wx.navigateTo({
      url: `../index_inviteFriend/index_inviteFriend`
    });
  },
  addToCart(e, clalback) {
    var y = this;
    this.isLogin(function() {
      var data = e.currentTarget.dataset;
      let params = {
        goods_id: data.id,
        type: 1,
        num: 1
      };
      util.promiseRequest(api.cart_add, params).then(res => {
        util.toast("添加购物车成功");
        // 更新全局商品数量
        typeof callback === "function" ? callback() : "";
        y.getShoppingCartNum(length => {
          if (length > 0) {
            wx.setTabBarBadge({
              index: 2,
              text: String(length)
            });
          } else {
            wx.removeTabBarBadge({
              index: 2
            });
          }
        });
      });
    }, e);
  },

  // 获取用户购物车的商品数量
  getShoppingCartNum(callback, func) {
    util.promiseRequest(api.cart_list, {}).then(res => {
      var data = res.data.response_data;
      var goodsNum = data.count;
      typeof callback === "function" ? callback(goodsNum) : "";
      typeof func === "function" ? func(data) : "";
    });
  },
  // 获取用户收货地址的条数
  getMy_shippingAddressLength(callback) {
    var y = this;
    util
      .promiseRequest(api.addr_list, {})
      .then(res => {
        var data = res.data.response_data.lists;
        wx.Storage.setItem("myshippingAddressLength", data.length);
        typeof callback === "function" ? callback(data.length) : "";
        // 防止再次加载全局地址空白影响提示显示
        if (data.length === 1) {
          wx.Storage.setItem("globalAddress", data[0]);
        }
      })
      .catch(err => {
        callback("false");
      });
  },
  // 获取用户可以领取的优惠券
  get_coupons(callback) {
    util.promiseRequest(api.get_coupons, {}).then(res => {
      let data = res.data.response_data.lists;
      typeof callback === "function" ? callback(data) : "";
    });
  },
  // 领取优惠券
  receive_coupons(e, callback) {
    let that = this;
    util
      .promiseRequest(api.receive_coupons, {
        id: e.currentTarget.dataset.id
      })
      .then(res => {
        console.log(res);
        var tishiData = res.data;
        let tishi;
        if (tishiData.error_msg) {
          tishi = tishiData.error_msg;
        }
        wx.showToast({
          title: tishi || "领取成功",
          icon: "none",
          duration: 2000
        });
        typeof callback === "function" ? callback() : app.get_coupons();
      })
      .catch(error => {
        console.log(error);
      });
  },
  // 是会员吗？
  isPlus(callback) {
    util.promiseRequest(api.basicInfo, {}).then(res => {
      var data = res.data.response_data;
      var state = data.lists[0].is_plus === "普通会员" ? false : true;
      typeof callback === "function" ? callback(state) : "";
    });
  }
});
