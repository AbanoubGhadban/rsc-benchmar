# frozen_string_literal: true

class ProductsController < ApplicationController
  layout "ecommerce"
  include ReactOnRailsPro::Stream

  def index
    @products_props = {
      searchParams: {
        page: params[:page],
        category: params[:category],
        brand: params[:brand],
        minPrice: params[:minPrice],
        maxPrice: params[:maxPrice],
        sort: params[:sort],
        dir: params[:dir]
      }.compact
    }
    stream_view_containing_react_components(template: "products/index")
  end

  def show
    @product_props = { slug: params[:slug] }
    stream_view_containing_react_components(template: "products/show")
  end
end
