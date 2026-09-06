import { useEffect, useState } from "react";

const useFetch = (url) => {
  const [data, setData] = useState(null);
  const [ispending, setPending] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      console.log("Fetching data from URL:", url); // Debug log

      try {
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${userInfo?.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Could not fetch the data");
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setPending(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, ispending, error };
};

export default useFetch;
