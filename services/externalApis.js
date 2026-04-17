const fetchGender = async (name) => {
  try {
    const res = await fetch(`https://api.genderize.io?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    return data;
  } catch (error) {
    throw new Error('Genderize returned an invalid response');
  }
};

const fetchAge = async (name) => {
  try {
    const res = await fetch(`https://api.agify.io?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    return data;
  } catch (error) {
    throw new Error('Agify returned an invalid response');
  }
};

const fetchNationality = async (name) => {
  try {
    const res = await fetch(`https://api.nationalize.io?name=${encodeURIComponent(name)}`);
    const data = await res.json();
    return data;
  } catch (error) {
    throw new Error('Nationalize returned an invalid response');
  }
};

module.exports = { fetchGender, fetchAge, fetchNationality };
