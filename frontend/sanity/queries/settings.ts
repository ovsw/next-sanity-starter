import { defineQuery } from "next-sanity";

export const SETTINGS_QUERY = defineQuery(`
  *[_type == "settings" && _id == "settings"][0]{
    _id,
    _type,
    siteName,
    logo{
      light{
        ...,
        asset->{
          _id,
          url,
          mimeType,
          metadata { lqip, dimensions { width, height } }
        }
      },
      dark{
        ...,
        asset->{
          _id,
          url,
          mimeType,
          metadata { lqip, dimensions { width, height } }
        }
      }
    },
    contact{
      email,
      phone,
      addressLines
    },
    socialLinks[]{
      _key,
      label,
      url
    }
  }
`);
