# frozen_string_literal: true

class AddressesController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def index
    stream_view_containing_react_components(template: "addresses/index")
  end
end
