import { useEffect, useState, useMemo } from "react";
import AxiosInstance from "../components/AxiosInstance";
import AOS from "aos";
import "aos/dist/aos.css";
import Adm from "../pages/Administration";

AOS.init({ duration: 1200 });

const About = () => {
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingPrincipal, setLoadingPrincipal] = useState(true);

  const renderListOrText = (value) => {
    if (!value) {
      return <p className="text-gray-600">No information available.</p>;
    }

    let parsed = value;

    // Try to parse JSON if it's a string
    if (typeof value === "string") {
      try {
        const maybeJson = JSON.parse(value);
        parsed = maybeJson;
      } catch {
        // keep as string if not valid JSON
      }
    }

    // Handle arrays
    if (Array.isArray(parsed)) {
      return (
        <ul className="list-disc pl-6 space-y-1 text-gray-700">
          {parsed.map((item, idx) => (
            <li key={idx} className="text-justify">
              {String(item)}
            </li>
          ))}
        </ul>
      );
    }

    // Handle objects nicely instead of [object Object]
    if (typeof parsed === "object" && parsed !== null) {
      return (
        <pre className="bg-gray-100 p-2 rounded text-sm text-gray-700 overflow-x-auto">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    }

    // Default: simple text
    return <p className="text-gray-700 text-justify">{String(parsed)}</p>;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await AxiosInstance.get("/institutions/");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setSchoolInfo(res.data[0]);
        }
      } catch (error) {
        console.error("Failed to fetch school info:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await AxiosInstance.get("/principal-vice-principal/");
        const list = Array.isArray(res.data) ? res.data : [];
        const p = list.find(
          (x) => (x.designation || "").toLowerCase() === "principal"
        );
        setPrincipal(p || null);
      } catch (err) {
        console.error("Failed to fetch principal:", err);
      } finally {
        setLoadingPrincipal(false);
      }
    })();
  }, []);

  const missionValue = useMemo(() => {
    return (
      schoolInfo?.mission ??
      schoolInfo?.misson ??
      schoolInfo?.missions ??
      null
    );
  }, [schoolInfo]);

  const objectivesValue = useMemo(() => {
    return (
      schoolInfo?.objectives ??
      schoolInfo?.objective ??
      schoolInfo?.aims ??
      schoolInfo?.goals ??
      null
    );
  }, [schoolInfo]);

  if (loading) {
    return (
      <section className="py-12 bg-gradient-to-b from-cream to-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          Loading school information...
        </div>
      </section>
    );
  }

  if (!schoolInfo) {
    return (
      <section className="py-12 bg-gradient-to-b from-cream to-white">
        <div className="container mx-auto px-4 text-center text-red-500">
          No school information available.
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="py-12 bg-gradient-to-b from-cream to-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <h2
          data-aos="fade-up"
          className="mb-8 text-3xl font-bold text-center md:text-4xl text-dustyroseDark"
        >
          About <span className="text-gray-800">{schoolInfo.name}</span>
        </h2>

        {/* Card 1: Image TOP, Description BELOW */}
        <div
          className="rounded-2xl border border-dustyrose/20 bg-white/70 shadow-sm p-6 md:p-8"
          data-aos="fade-up"
        >
          <div className="flex flex-col items-center gap-6">
            {/* Image first */}
            <div className="w-full" data-aos="fade-down">
              <div className="relative mx-auto w-64 h-64 md:w-80 md:h-80">
                {schoolInfo.institution_image ? (
                  <img
                    src={schoolInfo.institution_image}
                    alt={schoolInfo.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-xl border-4 border-dustyrose/20 shadow-lg"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-200 rounded-xl border-4 border-dustyrose/20">
                    No Image
                  </div>
                )}
                <div className="absolute -inset-3 rounded-xl border-2 border-dustyrose/30 animate-pulse-slow"></div>
                <div className="absolute -inset-5 rounded-xl bg-dustyrose/10 -z-10"></div>
              </div>
            </div>

            {/* Text below image */}
            <div className="w-full" data-aos="fade-up">
              <h1 className="text-2xl font-bold text-gray-800 py-2">
                School History
              </h1>
              <p className="mb-0 leading-relaxed text-gray-700 text-justify">
                {schoolInfo.history || "No history available."}
              </p>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-8" />

        {/* Card 1.5: Mission & Objectives */}
        <div
          className="rounded-2xl border border-dustyrose/20 bg-white/70 shadow-sm p-6 md:p-8"
          data-aos="fade-up"
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div data-aos="fade-right">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h3>
              <div className="leading-relaxed">{renderListOrText(missionValue)}</div>
            </div>
            <div data-aos="fade-left">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Our Objectives</h3>
              <div className="leading-relaxed">{renderListOrText(objectivesValue)}</div>
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="h-8" />

        {/* Card 2: Principal message */}
        <div
          className="rounded-2xl border border-dustyrose/20 bg-white/70 shadow-sm p-6 md:p-8"
          data-aos="fade-up"
        >
          <h3 className="text-2xl font-bold text-gray-800 mb-6">Principal's Message</h3>

          {loadingPrincipal ? (
            <div className="text-gray-600">Loading principal info…</div>
          ) : principal ? (
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              <div className="w-full lg:w-1/2 lg:order-1" data-aos="fade-right">
                <div className="relative mx-auto lg:me-auto w-64 h-64 md:w-80 md:h-80">
                  {principal.photo ? (
                    <img
                      src={principal.photo}
                      alt={principal.full_name || "Principal"}
                      className="absolute inset-0 w-full h-full object-cover rounded-xl border-4 border-dustyrose/20 shadow-lg"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-gray-200 rounded-xl border-4 border-dustyrose/20">
                      No Photo
                    </div>
                  )}
                  <div className="absolute -inset-3 rounded-xl border-2 border-dustyrose/30 animate-pulse-slow"></div>
                  <div className="absolute -inset-5 rounded-xl bg-dustyrose/10 -z-10"></div>
                </div>

                <div className="mt-4 text-center lg:text-left">
                  <div className="text-lg font-semibold text-gray-800">
                    {principal.full_name || "—"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {principal.designation
                      ? principal.designation.charAt(0).toUpperCase() +
                        principal.designation.slice(1)
                      : "Principal"}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-1/2 lg:order-2" data-aos="fade-left">
                <p className="leading-relaxed text-gray-700 mb-4 text-justify">
                  {principal.message || "No message available."}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">Principal info not found.</div>
          )}
        </div>
      </div>

      {/* Administration section below About */}
      <Adm />
    </section>
  );
};

export default About;
