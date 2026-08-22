import Link from "next/link";
import { HeaderBrand } from "./brand";
import { HeaderLink } from "./header-link";
import type { HeaderModel } from "./model";
import { NavigationIcon } from "./navigation-icon";

export function Header({ model }: { model: HeaderModel }) {
  return (
    <header>
      <Link aria-label={`${model.brand.label} home page`} href="/">
        <HeaderBrand brand={model.brand} />
      </Link>
      <nav aria-label="Main navigation">
        <ul>
          {model.navigation.items.map((item) => (
            <li key={item.key}>
              {item.kind === "link" ? (
                <HeaderLink link={item.link} />
              ) : (
                <details>
                  <summary>{item.label}</summary>
                  <ul>
                    {item.links.map((child) => (
                      <li key={child.key}>
                        <HeaderLink link={child.link}>
                          {child.icon ? <NavigationIcon icon={child.icon} /> : null}
                          {child.label}
                        </HeaderLink>
                        {child.description ? <p>{child.description}</p> : null}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          ))}
        </ul>
        {model.navigation.actions.length ? (
          <ul>
            {model.navigation.actions.map((action) => (
              <li key={action.key}>
                <HeaderLink link={action.link} />
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
    </header>
  );
}
