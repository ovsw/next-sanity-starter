/* eslint-disable @next/next/no-img-element -- ImageResponse renders embedded image data. */
import { fitPostOgTitle } from "@/lib/post-og-image";
import brand from "@/public/brand/brand.json";

export function PostOgImage({
  eyebrow,
  title,
  photoUrl,
  logo,
  mark,
}: {
  eyebrow: string;
  title: string;
  photoUrl?: string;
  logo: string;
  mark: string;
}) {
  const fittedTitle = fitPostOgTitle(title);
  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: brand.color,
        color: "white",
        overflow: "hidden",
      }}
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
        />
      ) : (
        <img
          src={mark}
          alt=""
          width={340}
          height={340}
          style={{ position: "absolute", right: 70, top: 145, opacity: 0.25 }}
        />
      )}
      {photoUrl ? (
        <div
          style={{
            display: "flex",
            position: "absolute",
            // The card renderer ignores `inset`, so the overlay needs a size.
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage:
              "linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.15)), linear-gradient(0deg, rgba(0,0,0,0.5), transparent)",
          }}
        />
      ) : null}
      <div
        style={{
          display: "flex",
          position: "relative",
          flexDirection: "column",
          padding: "60px 80px",
          width: "100%",
        }}
      >
        <img
          src={logo}
          alt=""
          width={300}
          height={90}
          style={{ objectFit: "contain", objectPosition: "left" }}
        />
        <div
          style={{
            display: "flex",
            marginTop: 55,
            width: 760,
            fontFamily: "Brand",
            fontSize: fittedTitle.fontSize,
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          {fittedTitle.text}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            fontFamily: "Brand",
            fontSize: 20,
          }}
        >
          {eyebrow}
        </div>
      </div>
    </div>
  );
}
