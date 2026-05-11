# frozen_string_literal: true

class HomeController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def index
    stream_view_containing_react_components(template: "home/index")
  end
end
