// pages/my_orderDetail/my_orderDetail.js
const app = getApp();
const util = require("../../utils/util.js");
const api = require("../../api/index.js");
Page({
  /**
   * 页面的初始数据
   */
  data: {
    orderId: "",
    orderData: {},
    state: "",
    statename: "",
    goods_ids: ""
  },
  // 再来一单
  again() {
    let params = {
      order_no: this.data.orderId
    };
    util.promiseRequest(api.once_again_order, params).then(res => {
      wx.switchTab({
        url: "/pages/shoppingCart/shoppingCart"
      });
    });
  },
  // 取消订单
  cancel() {
    let that = this;
    util
      .promiseRequest(api.cancel_order, {
        order_no: that.data.orderId
      })
      .then(res => {
        wx.showToast({
          title: "取消订单成功",
          icon: "none",
          duration: 2000
        });
        that.getOrder_detail(that.data.orderId);
      });
  },
  // 确认收货
  confirm(e) {
    let that = this;
    util
      .promiseRequest(api.confirm_goods, {
        order_no: that.data.orderId
      })
      .then(res => {
        wx.showToast({
          title: "确认收货成功",
          icon: "none",
          duration: 2000
        });
        that.getOrder_detail(that.data.orderId);
      });
  },
  // 去支付
  toPay() {
    var orderId = this.data.orderId;
    util
      .promiseRequest(api.pay_order, {
        order_no: orderId
      })
      .then(response => {
        var payParam = response.data.response_data;
        wx.requestPayment({
          timeStamp: payParam.timeStamp,
          nonceStr: payParam.nonceStr,
          package: payParam.package,
          signType: payParam.signType,
          paySign: payParam.paySign,
          success: function(res) {
            console.log("支付成功" + res);
            y.setData({
              kaiTong: true
            });
          },
          error: function(res) {
            console.log("支付失败" + res);
          }
        });
        console.log(response);
      });
  },
  // 去评价
  toEvaluation(e) {
    wx.navigateTo({
      url: `../my_evaluation/my_evaluation?orderId=${
        this.data.orderId
      }&staffId=${this.data.orderData.staffer}`
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      orderId: options.id
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    this.getOrder_detail(this.data.orderId);
  },
  getOrder_detail(id) {
    var y = this;
    util
      .promiseRequest(api.order_detail, {
        order_no: id
      })
      .then(res => {
        var data = res.data.response_data.lists[0];

        y.setData({
          orderData: data,
          goods_ids: data.goods_id
        });
      });
  },
  toProductList() {
    var y = this;
    util
      .promiseRequest(api.confirm_order_detail, {
        goods_ids: y.data.goods_ids
      })
      .then(response => {
        var data = response.data.response_data.lists;
        wx.Storage.setItem("confirm_order_detail", data);
        console.log(data);
        wx.navigateTo({
          url: `../shoppingCart_productList/shoppingCart_productList?orderId=${
            y.data.orderId
          }`
        });
      });
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {}
});
