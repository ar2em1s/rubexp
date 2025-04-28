import { Application } from '@hotwired/stimulus'

import RegexpController from './regexp_controller'

window.Stimulus = Application.start()

window.Stimulus.register('regexp', RegexpController)
