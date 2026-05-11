# frozen_string_literal: true

class CategoriesController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def show
    @category_props = {
      slug: params[:slug],
      searchParams: {
        page: params[:page],
        sort: params[:sort],
        dir: params[:dir]
      }.compact
    }
    stream_view_containing_react_components(template: "categories/show")
  end
end
