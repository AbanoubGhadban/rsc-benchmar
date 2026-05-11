# frozen_string_literal: true

class OrdersController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def index
    @orders_props = {
      searchParams: {
        page: params[:page]
      }.compact
    }
    stream_view_containing_react_components(template: "orders/index")
  end

  def show
    @order_props = { orderId: params[:id] }
    stream_view_containing_react_components(template: "orders/show")
  end
end
