import { screen } from "@testing-library/react";
import { renderConProviders } from "../testUtils.jsx";
import Blogs from "./Blogs.jsx";

vi.mock("../data/datos.js", async (importOriginal) => ({ ...(await importOriginal()), blogs: [] }));

describe("Blogs sin articulos", () => {
	it("avisa que todavia no hay articulos publicados", () => {
		renderConProviders(<Blogs />);

		expect(screen.getByText("Todavia no hay articulos publicados.")).toBeInTheDocument();
	});
});
