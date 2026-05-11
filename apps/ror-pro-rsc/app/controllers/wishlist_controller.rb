# frozen_string_literal: true

class WishlistController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def show
    stream_view_containing_react_components(template: "wishlist/show")
  end
end
