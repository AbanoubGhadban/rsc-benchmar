# frozen_string_literal: true

class HeavyBenchmarkController < ApplicationController
  layout "react_on_rails_default"
  include ReactOnRailsPro::Stream

  def index
    stream_view_containing_react_components(template: "heavy_benchmark/index")
  end
end
