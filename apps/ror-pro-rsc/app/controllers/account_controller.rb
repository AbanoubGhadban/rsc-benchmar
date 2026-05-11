# frozen_string_literal: true

class AccountController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def show
    stream_view_containing_react_components(template: "account/show")
  end
end
