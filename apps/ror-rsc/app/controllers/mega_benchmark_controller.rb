# frozen_string_literal: true

class MegaBenchmarkController < ApplicationController
  layout "react_on_rails_default"
  include ReactOnRailsPro::Stream

  def index
    stream_view_containing_react_components(template: "mega_benchmark/index")
  end
end
