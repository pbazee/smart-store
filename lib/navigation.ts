export type NavigationLink = {
  href: string;
  label: string;
};

export const primaryCategoryLinks: NavigationLink[] = [
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?gender=children", label: "Children" },
];

export const drawerMenuLinks: NavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop All" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?gender=children", label: "Children" },
  { href: "/shop?collection=new-arrivals", label: "New Arrivals" },
  { href: "/shop?collection=trending", label: "Trending" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export const drawerCategoryLinks: NavigationLink[] = [
  { href: "/shop?category=shoes", label: "Shoes" },
  { href: "/shop?subcategory=bags", label: "Bags" },
  { href: "/shop?subcategory=t-shirts", label: "T-Shirts" },
  { href: "/shop?category=accessories", label: "Accessories" },
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
