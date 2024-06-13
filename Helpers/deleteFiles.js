const fs = require("fs").promises;

const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log("Files deleted successfully");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  deleteFile,
};
