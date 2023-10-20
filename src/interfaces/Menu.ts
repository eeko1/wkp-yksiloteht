interface Menu {
    courses: Course[],
}

interface Course {
    price: string;
    name: string;
    diets: string[];
}

interface Weekly {
    days: Day[],
    courses: Course[]
}

interface Day {
    date: string;
    courses: Course[]

}

export type {Menu}
export type {Course}
export type {Weekly}
