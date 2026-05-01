import axios from 'axios';

const JWT = `${process.env.NEXT_JWT}`;

export async function upload() {
  try {
    const formData = new FormData();

    const file = new File(["hello"], "Testing.txt", { type: "text/plain" });

    formData.append("file", file);

    formData.append("network", "public");

    const request = await fetch("https://uploads.pinata.cloud/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${JWT}`,
      },
      body: formData,
    });
    const response = await request.json();
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}