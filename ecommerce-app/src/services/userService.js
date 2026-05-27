import users from "../data/users.json";

export const fetchUsers = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(users);
    }, 1500); // 1.5 segundos de delay
  });
};

export const searchUsers = async (query) => {
  const lowerQuery = query.trim().toLowerCase();
  return fetchUsers().then((data) =>
    data.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery)
    )
  );
};

export const getUserById = async (userId) => {
  return fetchUsers().then((data) => data.find((user) => user._id === userId));
};
