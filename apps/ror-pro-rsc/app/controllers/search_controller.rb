# frozen_string_literal: true

class SearchController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def show
    @search_props = { query: params[:q] || "" }
    stream_view_containing_react_components(template: "search/show")
  end
end
