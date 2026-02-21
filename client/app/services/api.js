import axios from 'axios'

const baseUrl = '/api/v1/';

export const get = (url) => {
    axios.get(`${baseUrl}${url}`).then((data) => {
        console.log(data);
});

}