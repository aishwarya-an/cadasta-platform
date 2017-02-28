var state;

var RouterMixins = {
  settings: {
    current_location: {url: null, bounds: null},
    current_relationship: {url: null}
  },

  init: function() {
    state = this.settings;
    this.setCurrentLocation();
  },


  /***************
  DETAIL PANNEL VS. MODAL
  ****************/
  resizeMap: function() {
    window.setTimeout(function() {
      map.invalidateSize();
    }, 400);
  },

  displayDetailPannel: function() {
    this.hideModal();
    if ($('.content-single').hasClass('detail-hidden')) {
      $('.content-single').removeClass('detail-hidden');
      this.resizeMap();
    }

    if ($('#project-detail').hasClass('detail-edit')) {
      $('#project-detail').removeClass('detail-edit');
    }
  },

  displayEditDetailPannel: function() {
    this.hideModal();
    if ($('.content-single').hasClass('detail-hidden')) {
      $('.content-single').removeClass('detail-hidden');
      this.resizeMap();
    }

    if (!$('#project-detail').hasClass('detail-edit')) {
      $('#project-detail').addClass('detail-edit');
    }
  },

  hideDetailPannel: function() {
    this.hideModal();
    if (!$('.content-single').hasClass('detail-hidden')) {
      $('.content-single').addClass('detail-hidden');
      this.resizeMap();
    }
  },

  displayModal: function() {
    if (!$("#additional-modals").is(':visible')) {
      $("#additional-modals").modal('show');
    }
  },

  hideModal: function() {
    if ($("#additional-modals").is(':visible')) {
      $("#additional-modals").modal('hide');
    }
  },


  /***************
  UPDATING THE STATE
  ****************/
  updateCurrentLocationUrl: function(url=null) {
    if (url) {
      if (!state.current_location.url) {
        state.current_location.url = $("#current-location").attr('href')
      }

    } else if (state.current_location.url !== window.location.hash) {
      state.current_location.url = window.location.hash;
    }
  },

  getCurrentLocationUrl: function() {
    return state.current_location.url;
  },

  getCurrentRelationshipUrl: function() {
    return state.current_relationship.url;
  },

  updateCurrentRelationshipUrl: function() {
    if (state.current_relationship.url !== window.location.hash) {
      state.current_relationship.url = window.location.hash;
    }
  },

  centerOnCurrentLocation: function() {
    if (state.current_location.bounds) {
      var bounds;
      var location = state.current_location.bounds;
      if (typeof(location.getBounds) === 'function'){
        bounds = location.getBounds();
      } else {
        // If the spatial unit is a marker
        var latLngs = [location.getLatLng()];
        bounds = L.latLngBounds(latLngs);
      }

      if (bounds.isValid()){
        map.fitBounds(bounds);
      }

      if (location.setStyle) {
        location.setStyle({color: '#edaa00', fillColor: '#edaa00', weight: 3})
      }
    }
  },

  resetLocationStyle: function() {
    if (state.current_location.bounds && state.current_location.bounds.setStyle) {
      state.current_location.bounds.setStyle({color: '#3388ff', fillColor: '#3388ff', weight: 2})  
    }
  },

  setCurrentLocation: function () {
    var parent = this;
    map.on("popupopen", function(evt){
      currentPopup = evt.popup;
      $('#spatial-pop-up').click(function(e){
        parent.resetLocationStyle();
        state.current_location.bounds = currentPopup._source;
        map.closePopup();
      });
    });
  },


  /***************
  ADDING EVENT HOOKS
  ****************/
  uploadResourceHooks: function() {
    original_file = $('input[name="original_file"]').val();

    if (original_file) {
      $('a.file-link').text(original_file);
      $('a.file-link').attr('download', original_file);
    }

    $('.file-input').change(function(event) {
      var file = event.target.files[0];

      $('a.file-link').on('link:update', function() {
          $('a.file-link').text(file.name);
          $('a.file-link').attr('download', file.name);
      });

      $('input[name="original_file"]').val(file.name);
      $('input[name="details-original_file"]').val(file.name);

      var ext = file.name.split('.').slice(-1)[0];
      var type = file.type || MIME_LOOKUPS[ext];
      $('input[name="mime_type"]').val(type);
    });

    $('a.file-remove').click(function() {
      $('.file-well .errorlist').addClass('hidden');
      $(this).parents('.form-group').removeClass('has-error');
    });
  },

  relationshipHooks: function() {
    var template = function(party) {
      if (!party.id) {
        return party.text;
      }
      return $(
        '<div class="party-option">' +
        '<strong class="party-name">' + party.text + '</strong>' +
        '<span class="party-type">' + party.element.dataset.type + '</span>' +
        '</div>'
      );
    };
    $("#party-select").select2({
      minimumResultsForSearch: 6,
      templateResult: template,
      theme: "bootstrap",
    });

    $('.datepicker').datepicker({
      yearRange: "c-200:c+200",
      changeMonth: true,
      changeYear: true,
    });

    // /* eslint-env jquery */
    $('#add-party').click(function(){
      $('#select-party').toggleClass('hidden');
      $('#new-item').toggleClass('hidden');
    });

    $('button#add-party').click(function() {
      $('#new_entity_field').val('on');
    });

    $('table#select-list tr').click(function(event) {
      const target = $(event.target).closest('tr');
      const relId = target.attr('data-id');
      target.closest('tbody').find('tr.info').removeClass('info');
      target.addClass('info');
      $('input[name="id"]').val(relId);
    });
  }


  /***************
  INTERCEPTING FORM SUBMISSIONS
  ****************/
  formSubmission: function(form_name, success_url=null){
    $(form_name).submit(function(e){
      e.preventDefault();
      var target = e.originalEvent || e.originalTarget;
      var formaction = $('.submit-btn', target.target ).attr('formAction');

      var data = $(this).serializeArray().reduce(function(obj, item) {
          obj[item.name] = item.value;
          return obj;
      }, {});

      $.ajax({
        method: "POST",
        url: formaction,
        data: data
      }).done(function(response) {
        if (!response.includes('DOCTYPE')) {
          var el = (form_name === '#modal-form' ? 
              document.getElementById('additional-modals') : document.getElementById('project-detail'))
          el.innerHTML = response;

        } else {
          if (window.location.hash === success_url) {
            sr.router();
          } else {
            window.location.hash = success_url
          }
        }
      });
    });
  }
}