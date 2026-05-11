# frozen_string_literal: true

class CartController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def show
    stream_view_containing_react_components(template: "cart/show")
  end
end
