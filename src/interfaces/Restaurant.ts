interface Restaurant {
    CompanyId: number;
    name: string;
    address: string;
    postalCode: string;
    city: string;
    phone: string;
    location: Location;
    type: string;
    coordinates: number[];
    company: string;
    _id: string;

}
interface Location {
    type: string;
    coordinates: number[];
}


export type {Restaurant}
