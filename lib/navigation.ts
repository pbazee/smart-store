import type { Category } from "@/types";

export type NavigationLink = {
  href: string;
  label: string;
};

export const primaryCategoryLinks: NavigationLink[] = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
];

export const drawerMenuLinks: NavigationLink[] = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/shop?gender=men", label: "Men" },
  { href: "/shop?gender=women", label: "Women" },
  { href: "/shop?collection=new-arrivals", label: "New Arrivals" },
  { href: "/shop?collection=trending", label: "Trending" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

const drawerCategoryPriority = ["shoes", "clothes", "accessories"];
const fallbackDrawerCategoryLinks: NavigationLink[] = [
  { href: "/shop?category=shoes", label: "Shoes" },
  { href: "/shop?category=clothes", label: "Clothes" },
  { href: "/shop?category=accessories", label: "Accessories" },
];

function matchesDrawerCategory(category: Category, value: string) {
  const normalizedName = category.name.trim().toLowerCase();
  const normalizedSlug = category.slug.trim().toLowerCase();
  const normalizedId = category.id.trim().toLowerCase();

  return (
    normalizedName === value ||
    normalizedSlug === value ||
    normalizedId === value
  );
}

export function getDrawerCategoryLinks(categories: Category[] = []): NavigationLink[] {
  if (categories.length === 0) {
    return fallbackDrawerCategoryLinks;
  }

  const links = drawerCategoryPriority
    .map((target) =>
      categories.find(
        (category) =>
          !category.parentId &&
          category.isActive !== false &&
          matchesDrawerCategory(category, target)
      )
    )
    .filter((category): category is Category => Boolean(category))
    .map((category) => ({
      href: `/shop?category=${encodeURIComponent(category.slug)}`,
      label: category.name,
    }));

  return links.length > 0 ? links : fallbackDrawerCategoryLinks;
}

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
    if (href === "/shop" && searchParams.get("gender")) {
      return false;
    }

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
