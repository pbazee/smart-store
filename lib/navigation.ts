export type NavigationLink = {
  href: string;
  label: string;
};

export const primaryCategoryLinks: NavigationLink[] = [
  { href: "/category/men", label: "Men" },
  { href: "/category/women", label: "Women" },
  { href: "/category/children", label: "Children" },
];

export const drawerMenuLinks: NavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop All" },
  { href: "/category/men", label: "Men" },
  { href: "/category/women", label: "Women" },
  { href: "/category/children", label: "Children" },
  { href: "/products?filter=new", label: "New Arrivals" },
  { href: "/products?filter=trending", label: "Trending" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export const drawerCategoryLinks: NavigationLink[] = [
  { href: "/category/shoes", label: "Shoes" },
  { href: "/category/bags", label: "Bags" },
  { href: "/category/tshirts", label: "T-Shirts" },
  { href: "/category/accessories", label: "Accessories" },
];

export function isNavigationLinkActive(
  pathname: string,
  searchParams: Pick<URLSearchParams, "get">,
  href: string
) {
  const [targetPath, targetQuery] = href.split("?");

  if (targetPath === "/") {
    if (pathname !== "/") {
      return false;
    }
  } else if (!(pathname === targetPath || pathname.startsWith(`${targetPath}/`))) {
    return false;
  }

  if (!targetQuery) {
    return true;
  }

  const targetParams = new URLSearchParams(targetQuery);

  for (const [key, value] of targetParams.entries()) {
    if (searchParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}
