"use strict";
const mapContainer = document.querySelector("#map");
const workoutForm = document.querySelector(".workout-form-new");
const workoutSelect = document.querySelector(".workout-select");
const workoutList = document.querySelector(".workouts");
const elevationRow = document.querySelector(".form-row-elevation");
const inputDistance = document.querySelector(".workout-distance");
const inputDuration = document.querySelector(".workout-duration");
const inputCadence = document.querySelector(".workout-cadence");
const inputElevation = document.querySelector(".workout-elevation");
// const workoutEdits = document.querySelectorAll(".workout-edit");
const workoutBtnEdit = document.querySelector(".workout-btn-edit");
const workoutEditSelect = document.querySelector(".workout-edit-select");
const editCadenceRow = document.querySelector(".form-edit-row-cadence");
const editElevationRow = document.querySelector(".form-edit-row-elevation");
const workoutBtnDelete = document.querySelector(".workout-btn-delete");
const cadenceRow = document.querySelector(".form-row-cadence");
const workoutEditForm = document.querySelector(".workout-edit-form");
const inputEditDistance = document.querySelector(".workout-edit-distance");
const inputEditDuration = document.querySelector(".workout-edit-duration");
const inputEditCadence = document.querySelector(".workout-edit-cadence");
const inputEditElevation = document.querySelector(".workout-edit-elevation");
const btnCancelEdit = document.querySelector(".cancel-edit");

const workoutMenu = document.querySelector(".workout-menu");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    //this.date =...
    //this.id = ...
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.type = "running";
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.type = "cycling";
  }
}

class App {
  #map;
  #eventObject;
  #workouts = [];
  #workoutMarkers = [];

  constructor() {
    this._getPosition();
    this._localstoragegGet();

    workoutSelect.addEventListener("change", this._toggleElevationField);
    workoutEditSelect.addEventListener("change", this._toggleEditElevation);

    workoutForm.addEventListener("submit", this._newWorkout.bind(this));
    workoutEditForm.addEventListener("submit", this._editWorkout.bind(this));
    workoutEditForm.addEventListener("reset", this._toggleEditForm);

    workoutList.addEventListener("click", this._handleClick.bind(this));
  }

  /////////////////////////////////// EDIT COMPONENETS/////////////////////////
  _hideEdit() {
    document.querySelectorAll(".workout-edit").forEach((workoutEdit) => {
      workoutEdit.classList.add("workout-edit-hidden");
    });
  }
  _toggleEditForm(workout) {
    workoutEditForm.classList.toggle("workout-form-hidden");
    workoutEditForm.querySelectorAll("input").forEach((input) => {
      input.value = "";
    });
    if (!workout) return;
    ///////////////SETTING INPUT FIELDS FOR EDIT///////
    workoutEditForm.setAttribute("data-id", `${workout.id}`);
    workoutEditSelect.value = workout.type;
    workoutEditForm.querySelector(".workout-edit-distance").value =
      workout.distance;
    workoutEditForm.querySelector(".workout-edit-duration").value =
      workout.duration;
    if (workout.type === "running") {
      if (editCadenceRow.classList.contains("form-row-hidden"))
        this._toggleEditElevation();
      workoutEditForm.querySelector(".workout-edit-cadence").value =
        workout.cadence;
    }
    if (workout.type === "cycling") {
      this._toggleEditElevation();
      workoutEditForm.querySelector(".workout-edit-elevation").value =
        workout.elevation;
    }
  }
  _toggleEditElevation() {
    editCadenceRow.classList.toggle("form-row-hidden");
    editElevationRow.classList.toggle("form-row-hidden");
  }

  _editWorkout(e) {
    e.preventDefault();
    // Fetching the old workout form this.#workouts[]
    const validateInputs = (...inputs) => inputs.every((inp) => inp > 0);

    const workout = this.#workouts.find(
      (workout) => workout.id === workoutEditForm.dataset.id
    );

    //getting the input values
    const type = workoutEditSelect.value;
    const duration = inputEditDuration.value;
    const distance = inputEditDistance.value;
    const cadence = inputEditCadence.value;
    const elevation = inputEditElevation.value;

    // if the user changes the type of the workout
    if (type !== workout.type) {
      let newWorkout;
      const index = this.#workouts.indexOf(workout);
      //create new workout according to the new type
      if (type === "running") {
        if (!validateInputs(distance, duration, cadence))
          return alert("Positive numbers only");
        newWorkout = new Running(workout.coords, distance, duration, cadence);
        newWorkout.date = workout.date;
        newWorkout.id = workout.id;
      }
      if (type === "cycling") {
        if (!validateInputs(distance, duration, elevation))
          return alert("Positive numbers only");
        newWorkout = new Cycling(workout.coords, distance, duration, elevation);
        newWorkout.date = workout.date;
        newWorkout.id = workout.id;
      }

      // Replace the old workout with newWorkout in this.#workouts array and update UI
      this.#workouts.splice(index, 1, newWorkout);
      this._updateWorkoutList();
      this._renderPopup(newWorkout, true);
      this._toggleEditForm();
      this._setLocalStorage();
    } else {
      //// User does not change the type of the workout
      workout.distance = distance;
      workout.duration = duration;
      if (type === "running") workout.cadence = cadence;
      if (type === "cycling") workout.elevation = elevation;
      this._renderWorkout(workout, true);
      this._renderPopup(workout, true);
    }
  }
  _updateWorkoutList() {
    document
      .querySelectorAll(".workout")
      .forEach((workout) => workout.remove());
    this.#workouts.forEach((workout) => {
      this._renderWorkout(workout);
    });
  }
  _deleteWorkout(workoutDiv, workout) {
    const index = this.#workouts.indexOf(workout);
    this.#workouts.splice(index, 1);
    workoutDiv.remove();
    console.log(this.#workouts);
    this._setLocalStorage();
  }
  _deleteAllWorkouts() {
    document.querySelectorAll(".workout").forEach((workout) => {
      workout.remove();
    });
    this.#workoutMarkers.forEach((marker) => {
      this.#map.removeLayer(marker);
    });
    this.#workouts = [];
    this.#workoutMarkers = [];
    this._setLocalStorage();
  }
  _sort(option) {
    if (option === "date") {
      this.#workouts.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    if (option === "distance") {
      this.#workouts.sort((a, b) => a.distance - b.distance);
    }
    if (option === "duration") {
      this.#workouts.sort((a, b) => a.duration - b.duration);
    }
    this._updateWorkoutList();
  }

  _handleClick(e) {
    /////////////// MENU BUTTONS //////////////////
    /////// Delete All /////
    if (e.target.closest(".delete-all")) {
      this._deleteAllWorkouts();
      return;
    }

    /// Sorting
    if (e.target.closest(".sort-distance")) {
      this._sort("distance");
      return;
    }
    if (e.target.closest(".sort-duration")) {
      this._sort("duration");
      return;
    }
    if (e.target.closest(".sort-date")) {
      console.log("sort date");
      this._sort("date");
      return;
    }

    const workoutDiv = e.target.closest(".workout");
    if (!workoutDiv) return;
    const workoutId = workoutDiv.dataset.id;
    const workout = this.#workouts.find((workout) => workout.id === workoutId);

    ////////Edit Button//////////
    if (e.target.closest(".workout-btn-edit")) {
      this._toggleEditForm(workout);
      return;
    }

    //// Delete Button ////
    if (e.target.closest(".workout-btn-delete")) {
      this._deleteWorkout(workoutDiv, workout);
      return;
    }

    // Closing forms and buttons
    this._hideEdit();
    this._hideForm();

    const workoutEdit = workoutDiv.childNodes[workoutDiv.childNodes.length - 2];
    workoutEdit.classList.remove("workout-edit-hidden");
    /////pan///
    if (workout) this.#map.setView(workout.coords, 14, { duration: 0.25 });
  }

  ///// LOCAL STORAGE//////
  _localstoragegGet() {
    const workouts = JSON.parse(localStorage.getItem("workouts"));
    if (!workouts) return;
    this.#workouts = workouts;
    this.#workouts.forEach((workout) => {
      Object.setPrototypeOf(
        workout,
        workout.type === "running" ? Running : Cycling
      );
      this._renderWorkout(workout);
    });
  }
  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  ///////////////// MAP //////////////////////////////////////////////////
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        (err) => alert(err.message)
      );
  }
  _whenMapLoads() {
    this.#workouts.forEach((workout) => {
      this._renderPopup(workout);
    });
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map");
    // this.#map.on("load", this._whenMapLoads);
    this.#map.setView(coords, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on the map

    this.#map.addEventListener("click", this._showForm.bind(this));
    this.#workouts.forEach((workout) => {
      this._renderPopup(workout);
    });
  }

  ////////////////////////// FORM////////////
  _showForm(e) {
    this.#eventObject = e;
    this._hideEdit();
    workoutForm.classList.remove("workout-form-hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        "";
    workoutSelect.value = "running";
    workoutForm.classList.add("workout-form-hidden");
  }

  _toggleElevationField() {
    cadenceRow.classList.toggle("form-row-hidden");
    elevationRow.classList.toggle("form-row-hidden");
  }

  _renderWorkout(workout, editing = false) {
    const type = workout.type;
    const html = `<div class="workout workout-${type}" data-id="${workout.id}">
    <h2 class="workout-title">
      ${workout.type} on <span class="workout-date">August 24</span>
    </h2>
    <div class="workout-details">
      <span class="workout-icon">${type === "running" ? "🏃‍♀️" : "🚴🏻‍♀️"}</span>
      <span class="workout-value">${workout.distance}</span>
      <span class="workout-uint">KM</span>
    </div>
    <div class="workout-details">
      <span class="workout-icon">🕣</span>
      <span class="workout-value">${workout.duration}</span>
      <span class="workout-uint">min</span>
    </div>
    <div class="workout-details">
      <span class="workout-icon">${type === "running" ? "🦶🏼" : "📈"}</span>
      <span class="workout-value">${
        type === "running" ? workout.cadence : workout.elevation
      }</span>
      <span class="workout-uint">steps/min</span>
    </div>
    <div class="workout-edit workout-edit-hidden">
    <button class="workout-btn-edit" name="edit button">
    <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-pencil" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <path d="M4 20h4l10.5 -10.5a1.5 1.5 0 0 0 -4 -4l-10.5 10.5v4"></path>
   <line x1="13.5" y1="6.5" x2="17.5" y2="10.5"></line>
</svg>
</button>
<button class="workout-btn-delete" name="delete button">
<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-trash" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
   <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
   <line x1="4" y1="7" x2="20" y2="7"></line>
   <line x1="10" y1="11" x2="10" y2="17"></line>
   <line x1="14" y1="11" x2="14" y2="17"></line>
   <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path>
   <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>
</svg>
</button>
    </div>
  </div>`;

    // If the workout is being edited, remove the old workout from the list and render new one
    if (editing) {
      const workoutDiv = document.querySelector(`[data-id="${workout.id}"`);
      if (!workoutDiv) return;
      console.log(workoutDiv);
      workoutDiv.insertAdjacentHTML("afterend", html);
      workoutDiv.remove();
    } else {
      workoutForm.insertAdjacentHTML("afterend", html);
    }
  }

  //////////////// POPUP///.
  _renderPopup(workout, editing = false) {
    const marker = L.marker(workout.coords).addTo(this.#map);
    const popup = L.popup({
      minWeight: 100,
      maxWidth: 300,
      autoClose: false,
      closeOnClick: false,
      className: `${workout.type}-popup`,
    }).setContent(
      `${workout.type} on ${Intl.DateTimeFormat(navigator.language, {
        month: "long",
        day: "numeric",
      }).format(new Date(workout.date))}`
    );
    marker.bindPopup(popup).openPopup();

    // if the workout is being edited
    if (editing) {
      const index = this.#workoutMarkers.findIndex((marker) => {
        return (
          marker._latlng.lat === workout.coords[0] &&
          marker._latlng.lng === workout.coords[1]
        );
      });

      // Deleting the old marker from the map
      this.#map.removeLayer(this.#workoutMarkers[index]);
      // replacing the old marker with the new one
      this.#workoutMarkers.splice(index, 1, marker);

      return;
    }
    this.#workoutMarkers.push(marker);
  }

  _newWorkout(e) {
    e.preventDefault();
    const validateInputs = (...inputs) => inputs.every((inp) => inp > 0);
    const { lat, lng } = this.#eventObject.latlng;
    const type = workoutSelect.value;
    const distance = inputDistance.value;
    const duration = inputDuration.value;
    let workout;
    if (type === "running") {
      const cadence = inputCadence.value;

      if (!validateInputs(distance, duration, cadence))
        return alert("Positive numbers only");
      workout = new Running([lat, lng], distance, duration, cadence, type);

      this.#workouts.push(workout);
    }
    if (type === "cycling") {
      const elevation = inputElevation.value;
      if (!validateInputs(distance, duration, elevation))
        return alert("positive numbers only");
      workout = new Cycling([lat, lng], distance, duration, elevation, type);

      this.#workouts.push(workout);
    }
    this._renderPopup(workout);
    this._hideForm();
    this._renderWorkout(this.#workouts[this.#workouts.length - 1]);
    this._setLocalStorage();
    console.log("local storage");
  }
  checkWorkoutType(workout) {
    return workout.type;
  }
  clearWorkouts() {
    localStorage.clear();
  }
}

const app = new App();
//// Toggle elevation/////

//set #workouts to local storage with workouts as key
