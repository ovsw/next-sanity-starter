import type { ObjectFieldProps } from "sanity";

/**
 * Renders an object field's members without the surrounding fieldset (title,
 * border, and padding). Use it for small helper objects such as link
 * destinations, whose inner fields already explain themselves; the extra frame
 * only adds nesting to the form.
 */
export function InlineObjectField(props: ObjectFieldProps) {
  if (props.validation.length > 0) return props.renderDefault(props);
  return <>{props.children}</>;
}
