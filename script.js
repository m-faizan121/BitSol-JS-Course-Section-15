'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


class Workout {
    
}



// --------------------------------------------------------------------------- //
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputAddress = document.querySelector('.form__input--address');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const addBtn = document.querySelector('.form__btn');
const clearBtn = document.querySelector('.form__btn2');
const suggestions = document.querySelector('.suggestion');
const centerBtn = document.querySelector('.centerBtn');
const mapArea = document.querySelector('#map');
const addressBox = document.querySelector('.address_box');
const box1 = document.querySelector('.box1');
const box2 = document.querySelector('.box2');
const delAddressBtn = document.querySelector('#delAddress');
const addOrderBtn = document.querySelector('#addOrder');
const customerDataBox = document.querySelector('.customerData');
const calcDistanceBtn = document.querySelector('#distanceBtn');
const distanceArea = document.querySelector('.distanceArea');

// Main Application class
class MaptyApp {

    // Private members start with #
    #map;
    #mapEvent;
    #features;
    #markers = new Array();
    #customersList = new Array(); // To store customers data
    #lastCoordinates;
    #currentLocation;

    constructor() {

        // Reterieving data from Local Storage
        let data = JSON.parse(localStorage.getItem('customers'));
        if(data)
            this.#customersList = data;

        this._getLocation();
        
        addBtn.addEventListener('click', this._addAddress.bind(this)); // To add address on map
        clearBtn.addEventListener('click', function(){ // To clear address
            inputAddress.value = '';
        });
        inputAddress.addEventListener("keypress", this.#enterEvent.bind(this));
        suggestions.addEventListener('click', this.#suggestionItemEvent.bind(this))
        //mapArea.addEventListener('click', this.#moveToCenter.bind(this));
        delAddressBtn.addEventListener('click', this.#deleteAddress.bind(this));
        addOrderBtn.addEventListener('click', this.#addOrder.bind(this));
        calcDistanceBtn.addEventListener('click', this.#calculateDistance.bind(this));
    }
    

    // To handle ENTER button event on address field
    #enterEvent(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            this._addAddress(e);
        }
    }

    // To handle calculate distance button
    #calculateDistance() {
        calcDistanceBtn.style.display = 'none';
        distanceArea.style.display = 'block';
        var polylinePoints = [this.#currentLocation];         
        for(const cus of this.#customersList) {
            polylinePoints.push(cus.coords);
        }
        var polyline = L.polyline(polylinePoints, {
            color: 'red',
            weight: 5,
            opacity: 1,
            smoothFactor: 1
        }).addTo(this.#map);
    }

    // To handle click on marker
    #markerClickEvent(flag, event) {
        event.target.openPopup();

        // Removing all childs
        while (customerDataBox.firstChild) {
            customerDataBox.removeChild(customerDataBox.lastChild);
        }
        customerDataBox.innerHTML = '<center><h1 id="heading"></h1></center>';
        const error = document.createElement('div');
        error.classList.add('error');
        customerDataBox.appendChild(error);
        
        if(flag === true){
            document.getElementById('heading').innerHTML = "Company Details";
            error.innerHTML = "<h1> <span>ID:</span> 11111</h1><h1>BitSol Technologies</h1>";
        }
        else {
            document.getElementById('heading').innerHTML = "Customer Details";
            
            const customer = this.#findCustomer(event.target._leaflet_id);
            if(customer === null) {
                error.innerHTML = "<h1>Record Not Found</h1>";
            }
            else {
                error.innerHTML = `<h1> <span>ID:</span> ${customer.id}</h1>
                                   <h1><span>Name:</span> ${customer.name}</h1>
                                   <h1><span>Meal:</span> ${customer.meal}</h1>
                                   <h1><span>Bill:</span> Rs. ${customer.bill}</h1><br>
                                   <h1>${event.target._popup._content}</h1>`;
            }
        }
        //e.target.openPopup();
        customerDataBox.style.display = 'block';
    }
    
    // To handle click on Center button
    #moveToCenter(e) {
        customerDataBox.style.display = 'none';
    }

    // To delete address and marker from map
    #deleteAddress(e) {
        // let id = document.querySelector('.address_box').children[0].children[0].id;
        // id = parseInt(id);
        // for(let i=0; i<this.#markers.length; i++) {
        //     if(this.#markers[i]._leaflet_id === id) {
        //         console.log('here');
        //         this.#map.removeLayer(this.#markers[i]);
        //         this.#markers.splice(i,1);
        //         break;
        //     }
        // }
        this.#map.removeLayer(this.#markers.at(-1));
        this.#markers.splice(this.#markers.length-1,1);
        box1.style.display = 'block';
        box2.style.display = 'none';
    }

    // To handle add order event
    #addOrder(e) {

        let cusName = document.getElementById('name').value;
        if(cusName === "" || cusName === null) {
            alert('Please Enter Customer Name');
            return;
        }
        let cusMeal = document.getElementById('meal').value;
        if(cusMeal === "" || cusMeal === null) {
            alert('Please Enter Ordered Meal');
            return;
        }

        let cusContact = document.getElementById('contact').value;
        if(cusContact === "" || cusContact === null) {
            alert('Please Enter Customer Contact');
            return;
        }

        let cusBill = document.getElementById('bill').value;
        if(cusBill === "" || cusBill === null) {
            alert('Please Enter Bill Amount');
            return;
        }

        let cusID = document.querySelector('.address_box').children[0].children[0].id;
        const address = document.querySelector('.address_box').children[0].children[0].textContent;
        let customer = new Customer(cusID, cusName, cusMeal, cusContact, cusBill, address.substring(2), this.#lastCoordinates);
        console.log(customer);
        this.#customersList.push(customer);
        
        ////////////////// Store Data to Local Storage
        localStorage.setItem('customers', JSON.stringify(this.#customersList));
        /////////////////////////////////////////////

        box2.style.display = 'none';
        box1.style.display = 'block';
        alert('Order Added Successfully');
    }

    // To handle suggestion item click event
    #suggestionItemEvent(e) {
        
        if(e.target.className === 'suggestion_item')
        {
            if(addressBox.children.length === 2)
                addressBox.removeChild(addressBox.children[0]);

            const address = e.target.innerHTML;
            const id = e.target.id;
            const coordinates = this.#features[id-1].geometry.coordinates; // Extract coordinates in form [long, lat] 
                //console.log(coordinates); 
            
                // Adding Marker
            const markerID = this._addMarker(coordinates, address);
            this.#lastCoordinates = coordinates;

            suggestions.style.display = 'none';
            box1.style.display = 'none';
            box2.style.display = 'block';

            
            let div = document.createElement('div');
            div.classList.add('form__row');
            div.innerHTML = `<h3 id='${markerID}' class='address'> ${address} </h3>`;
            addressBox.prepend(div);
        }
        
    }

    // To extract current location
    _getLocation() {
        // To get current location
        if(navigator.geolocation){ // If geocloaction API exist in browser
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), 
                function() { // Function for error
                    alert("Oops! Your location not found ...")
                }
            );
        }

    }

    _renderData() {
        //console.log(this);
        for(const value of this.#customersList) {
            
            const loc = value.coords;
            let marker1 = L.marker(loc).addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: 'running-popup'
                })
            ).
            setPopupContent(value.address).openPopup();
            value.id = marker1._leaflet_id;
            marker1.on('click', this.#markerClickEvent.bind(this, false));
            this.#markers.push(marker1);
        }
    }
    

    // Apply geocoding on address using Geopapify Map API
    // #applyGeocoding(address) {
    //     var requestOptions = {
    //         method: 'GET',
    //     };
    //     let features;
    //     const responseAPI = fetch(`https://api.geoapify.com/v1/geocode/search?text=${address}&apiKey=162194608efa43d4b41ad9eac49fb346`, requestOptions);
    //     responseAPI.then(response => response.json())
    //         .then(result => { // If response is good
                
                

    //         })
    //         .catch(error => console.log('error', error));
        
    // }

    // To get address by form and convert into coordinates using Geocoding
    _addAddress(e) {
        const address = inputAddress.value;
        if(address === "") { // Empty address
            alert('Please Enter Address');
            return;
        }
        

        var requestOptions = {
            method: 'GET',
        };
        const responseAPI = fetch(`https://api.geoapify.com/v1/geocode/search?text=${address}&apiKey=162194608efa43d4b41ad9eac49fb346`, requestOptions);
        responseAPI.then(response => response.json())
            .then(result => { // If response is good
                
                this.#features = result.features;
                if(this.#features.length == 0) { // If no address found
                    alert("Invalid Address ...");
                    return;
                }
                this.#showSuggestions();
                // return;
                // const coordinates = features[0].geometry.coordinates; // Extract coordinates in form [long, lat] 
                // //console.log(coordinates); 
                // this._addMarker(coordinates, address);

            })
            .catch(error => console.log('error', error));
        
        
    }

    #findCustomer(id) {
        let i=0;
        while(i < this.#customersList.length) {
            let id2 = Number(this.#customersList[i].id);
            if(id === id2)
                return this.#customersList[i];
            i++;
        }
        return null;
    }

    // Load map in start and mark the current location
    _loadMap(location) {
       // console.log(location.coords);
       const {latitude, longitude} = location.coords;
       const myCordinates = [latitude, longitude];
       this.#currentLocation = myCordinates;
       // Load map using thirt party API called (Leaflet)
       // L is a namespace global variable in Leaflet javascript file
       this.#map = L.map('map').setView(myCordinates, 13, {
        animate: true,
        pan: {
            animate: true,
          duration: 10.0,
        },
       }); // 13 is zoom level

       let myIcon = L.icon({
        iconUrl: "markerBitsol.png",
        iconSize: [30,40],
      });
  
       
       
       L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
           attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
       }).addTo(this.#map);

       // Add marker to current location
       const marker1 = L.marker(myCordinates).addTo(this.#map)
           .bindPopup(
           L.popup({
               maxWidth: 250,
               minWidth: 100,
               autoClose: false,
               closeOnClick: false,
               className: 'running-popup'
           })
       ).setPopupContent('BitSol Technologies').openPopup();
       marker1.on('click', this.#markerClickEvent.bind(this, true));
       // Add event listner on map
       this.#map.on('click', this.#moveToCenter.bind(this));
       this._renderData(); // To add previous data in app
    }

    // Show suggestions from API response
    #showSuggestions() {
        // Removing all childs
        while (suggestions.firstChild) {
            suggestions.removeChild(suggestions.lastChild);
        }
        suggestions.style.display = 'block';
        for(let i=0; i<this.#features.length; i++) {
            let div = document.createElement('div');
            div.classList.add('form__row');
            const formattedAddress = this.#features[i].properties.formatted;
            div.innerHTML = `<h3 id=${i+1} class='suggestion_item'> ${formattedAddress} </h3>`;
            suggestions.appendChild(div);
        }
    }

    // Show order form
    _showOrderForm(e) {
        
    }

    // Add marker on given coordinates
    _addMarker(coordinates, address) {
        const loc = [coordinates[1], coordinates[0]];
        let marker1 = L.marker(loc).addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: 'running-popup'
                })
            ).
            setPopupContent(address).openPopup();
        const id = marker1._leaflet_id;
        marker1.on('click', this.#markerClickEvent.bind(this, false));
        this.#markers.push(marker1);
        
        return id;
    }
}

// Driver Code
const mapty = new MaptyApp();

