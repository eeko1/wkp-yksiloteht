import {fetchData} from './functions';
import {UpdateResult} from './interfaces/UpdateResult';
import {UploadResult} from './interfaces/UploadResult';
import {Restaurant} from './interfaces/Restaurant';
import {Menu, Weekly} from './interfaces/Menu';
import {LoginUser, UpdateUser, User} from './interfaces/User';
import {apiUrl, uploadUrl, positionOptions} from './variables';
import * as L from 'leaflet';

// PWA code
const loginForm = document.querySelector('#login-form');
const profileForm = document.querySelector('#profile-form');
const avatarForm = document.querySelector('#avatar-form');

// select inputs from the DOM
const usernameInput = document.querySelector('#username') as HTMLInputElement | null;
const passwordInput = document.querySelector('#password') as HTMLInputElement | null;

const profileUsernameInput = document.querySelector(
  '#profile-username'
) as HTMLInputElement | null;
const profileEmailInput = document.querySelector(
  '#profile-email'
) as HTMLInputElement;

const avatarInput = document.querySelector('#avatar') as HTMLInputElement | null;

// select profile elements from the DOM
const usernameTarget = document.querySelector('#username-target');
const emailTarget = document.querySelector('#email-target');
const avatarTarget = document.querySelector('#avatar-target');

// TODO: function to login
const login = async (user: {username: string; password: string;}): Promise<LoginUser> => {
  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  };
  return await fetchData<LoginUser>(apiUrl + "/auth/login", options);
};

// TODO: function to upload avatar
const uploadAvatar = async (image: File, token: string): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append("avatar", image)
  const options: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer` + token,
    },
    body: formData,
  };
  return await fetchData(apiUrl + "/users/avatar", options);
};

// TODO: function to update user data
const updateUserData = async (
  user: UpdateUser,
  token: string
): Promise<UpdateResult> => {
  const options: RequestInit = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(user),
  };
  return await fetchData<UpdateResult>(apiUrl + "/users", options);
}

// TODO: function to add userdata (email, username and avatar image) to the
// Profile DOM and Edit Profile Form
const addUserDataToDom = (user: User): void => {
  if (!usernameTarget || !emailTarget || !avatarTarget || !profileEmailInput || !profileUsernameInput) return;
  usernameTarget.innerHTML = user.username;
  emailTarget.innerHTML = user.email;
  (avatarTarget as HTMLImageElement).src = uploadUrl + user.avatar;

  profileEmailInput.value = user.email;
  profileUsernameInput.value = user.username;
};

// function to get userdata from API using token
const getUserData = async (token: string): Promise<User> => {
  const options: RequestInit = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  return await fetchData<User>(apiUrl + "/users/token", options);
};

// TODO: function to check local storage for token and if it exists fetch
// userdata with getUserData then update the DOM with addUserDataToDom
const checkToken = async (): Promise<void> => {;
const token = localStorage.getItem("token");
if(!token){
  return;
}
const userData = await getUserData(token);
addUserDataToDom(userData);

};

// call checkToken on page load to check if token exists and update the DOM
checkToken();

// TODO: login form event listener
// event listener should call login function and save token to local storage
// then call addUserDataToDom to update the DOM with the user data
loginForm?.addEventListener('submit', async (evt)=>{
  evt.preventDefault();
  if (!usernameInput || !passwordInput) return;
  const user = {
    username: usernameInput.value,
    password: passwordInput.value,
  }
  const loginData = await login(user);
  console.log(loginData);
  /* alert(loginData.message); */
  addUserDataToDom(loginData.data);
  localStorage.setItem("token", loginData.token);
});

// TODO: profile form event listener
// event listener should call updateUserData function and update the DOM with
// the user data by calling addUserDataToDom or checkToken
profileForm?.addEventListener('submit', async (evt)=>{
  evt.preventDefault();
  if (!profileUsernameInput || !profileEmailInput) return;
  const user = {
    username: profileUsernameInput.value,
    email: profileEmailInput.value,
  }
  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
  const updateData = await updateUserData(user, token);
  addUserDataToDom(updateData.data);
});


// TODO: avatar form event listener
// event listener should call uploadAvatar function and update the DOM with
// the user data by calling addUserDataToDom or checkToken
avatarForm?.addEventListener('submit', async (evt)=>{
  evt.preventDefault();
if (!avatarInput?.files) {
  return;
}

  const image = avatarInput.files[0];

  const token = localStorage.getItem("token");
  if (!token) {
    return;
  }
  const avatarData = await uploadAvatar(image, token);
  console.log(avatarData);
  checkToken();
});



const map = L.map('map').setView([60.1699, 24.9384], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const error = (err: GeolocationPositionError) => {
  console.warn(`ERROR(${err.code}): ${err.message}`);
};

const success = (position: GeolocationPosition) => {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
}

(async () => {
  const restaurants = await fetchData<Restaurant[]>(apiUrl + '/restaurants');

  restaurants.forEach(async (restaurant: Restaurant) => {
    const menu = await fetchData<Menu>(apiUrl + `/restaurants/daily/${restaurant._id}/fi`);
    const menu2 = await fetchData<Weekly>(apiUrl + `/restaurants/weekly/${restaurant._id}/fi`);

    const marker = L.marker([
      restaurant.location.coordinates[1],
      restaurant.location.coordinates[0],
    ]).addTo(map);

    const openDailyMenuDialog = () => {
      let infoHtml = `
        <table>
          <tr>
            <th>Course</th>
            <th>Diet</th>
            <th>Price</th>
          </tr>
      `;

      menu.courses.forEach((course) => {
        const { name, diets, price } = course;
        infoHtml += `
          <tr>
            <td>${name}</td>
            <td>${diets ?? ' - '}</td>
            <td>${price ?? ' - '}</td>
          </tr>
        `;
      });

      const infoPopup = L.popup()
        .setLatLng(marker.getLatLng())
        .setContent(infoHtml);

      map.openPopup(infoPopup);
    };

    const openWeeklyMenuDialog = () => {
      let infoHtml = `
        <h3>${restaurant.name} - Weekly Menu 2</h3>
      `;

      menu2.days.forEach(day => {
          infoHtml += `
            <h4>${day.date}</h4>
            <table>
              <tr>
                <th>Course</th>
                <th>Diet</th>
                <th>Price</th>
              </tr>
          `;

          day.courses.forEach(course => {
              const { name, diets, price } = course;
              infoHtml += `
                <tr>
                  <td>${name}</td>
                  <td>${diets ?? ' - '}</td>
                  <td>${price ?? ' - '}</td>
                </tr>
              `;
          });

          infoHtml += `</table>`;
      });

      const weeklyMenuDialog = L.popup()
          .setLatLng(marker.getLatLng())
          .setContent(infoHtml);

      map.openPopup(weeklyMenuDialog);
  };
    const openPopup = () => {
      const popupContent = document.createElement('div');

      const popupHtml = `
        <h3>${restaurant.name}</h3>
        <p>${restaurant.address}</p>
        <button class="info-button">Daily Menu</button>
        <button class="weekly-menu">Weekly Menu</button>
      `;

      popupContent.innerHTML = popupHtml;

      const dailyMenu = popupContent.querySelector('.info-button');
      dailyMenu?.addEventListener('click', openDailyMenuDialog);

      const weeklyMenu = popupContent.querySelector('.weekly-menu');
      weeklyMenu?.addEventListener('click', openWeeklyMenuDialog);

      const popup = L.popup()
        .setLatLng(marker.getLatLng())
        .setContent(popupContent);

      map.openPopup(popup);
    };

    marker.on('click', openPopup);
  });
})();
navigator.geolocation.getCurrentPosition(success, error, positionOptions);
