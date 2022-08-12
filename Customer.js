
class Customer {


    constructor(id, name, meal, contact, bill, address, coords) {
        this.id = id;
        this.name = name;
        this.meal = meal;
        this.contact = contact;
        this.bill = bill;
        this.address = address;
        this.coords = [coords[1], coords[0]];
    }

    show() {
        console.log(this.id + ", " + this.name + ", " + this.meal + ", " + this.contact + ", " + this.bill + ", " + this.address);
    }

    getID() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    getMeal() {
        return this.meal;
    }

    getBill() {
        return this.bill;
    }

}