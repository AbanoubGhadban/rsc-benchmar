# frozen_string_literal: true

class CheckoutController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def show
    stream_view_containing_react_components(template: "checkout/show")
  end
end
