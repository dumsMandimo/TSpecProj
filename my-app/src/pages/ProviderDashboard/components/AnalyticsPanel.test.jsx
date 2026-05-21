import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

import AnalyticsPanel from "./AnalyticsPanel";

jest.mock("./AnalyticsPanel.css", () => {}, { virtual: true });

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("../../../services/firebase", () => ({
  db: {},
  auth: {
    currentUser: {
      uid: "provider-uid",
    },
  },
}));

import { getDocs } from "firebase/firestore";
import { auth } from "../../../services/firebase";

// ── Canvas mock ──────────────────────────────────────────────────────────────

const mockCtx = {
  canvas: { width: 800, height: 600 },

  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  rect: jest.fn(),
  roundRect: jest.fn(),

  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  arcTo: jest.fn(),
  bezierCurveTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  ellipse: jest.fn(),

  fill: jest.fn(),
  stroke: jest.fn(),
  clip: jest.fn(),
  drawImage: jest.fn(),

  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),

  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  scale: jest.fn(),
  transform: jest.fn(),
  setTransform: jest.fn(),
  resetTransform: jest.fn(),

  setLineDash: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn(),
  })),
  createPattern: jest.fn(),

  getImageData: jest.fn(() => ({ data: [] })),
  putImageData: jest.fn(),

  strokeStyle: "",
  fillStyle: "",
  lineWidth: 1,
  font: "12px Arial",
  textAlign: "center",
  textBaseline: "middle",
  globalAlpha: 1,
};

const originalCreateElement = document.createElement.bind(document);
const originalOpen = window.open;

beforeAll(() => {
  Object.defineProperty(HTMLCanvasElement.prototype, "offsetWidth", {
    configurable: true,
    value: 800,
  });
});

beforeEach(() => {
  jest.clearAllMocks();

  auth.currentUser = { uid: "provider-uid" };

  HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCtx);

  window.open = jest.fn(() => ({
    document: {
      write: jest.fn(),
      close: jest.fn(),
    },
    print: jest.fn(),
  }));
});

afterEach(() => {
  if (document.createElement.mockRestore) {
    document.createElement.mockRestore();
  }
  window.open = originalOpen;
});

const LISTINGS = [
  {
    id: "opp-1",
    data: () => ({
      title: "React Internship",
      type: "internship",
    }),
  },
  {
    id: "opp-2",
    data: () => ({
      title: "QA Learnership",
      type: "learnership",
    }),
  },
];

const APPLICATIONS = [
  {
    id: "app-1",
    data: () => ({
      opportunityId: "opp-1",
      status: "submitted",
      appliedAt: {
        toDate: () => new Date(),
      },
    }),
  },
  {
    id: "app-2",
    data: () => ({
      opportunityId: "opp-1",
      status: "accepted",
      appliedAt: {
        toDate: () => new Date(),
      },
    }),
  },
  {
    id: "app-3",
    data: () => ({
      opportunityId: "opp-2",
      status: "shortlisted",
      appliedAt: {
        toDate: () => new Date(),
      },
    }),
  },
  {
    id: "app-4",
    data: () => ({
      opportunityId: "opp-2",
      status: "rejected",
      appliedAt: {
        toDate: () => new Date(),
      },
    }),
  },
];

function setupSuccessfulFetch() {
  getDocs
    .mockResolvedValueOnce({ docs: LISTINGS })
    .mockResolvedValueOnce({ docs: APPLICATIONS });
}

function setupNoListings() {
  getDocs.mockResolvedValueOnce({ docs: [] });
}

function setupFirestoreError() {
  getDocs.mockRejectedValueOnce(new Error("Firestore failed"));
}

function mockAnchorForDownload() {
  const anchor = {
    click: jest.fn(),
    _href: "",
    _download: "",
    set href(v) {
      this._href = v;
    },
    get href() {
      return this._href;
    },
    set download(v) {
      this._download = v;
    },
    get download() {
      return this._download;
    },
  };

  jest.spyOn(document, "createElement").mockImplementation((tagName) => {
    if (String(tagName).toLowerCase() === "a") {
      return anchor;
    }
    return originalCreateElement(tagName);
  });

  return anchor;
}

function getMetricCard(label) {
  const labels = screen.getAllByText(
    new RegExp(`^${label}$`, "i")
  );

  const metricLabel = labels.find(
    (el) =>
      el.className === "analytics__metric-label"
  );

  return metricLabel.closest("article");
}

describe("AnalyticsPanel", () => {
  it("shows loading state initially", () => {
    getDocs.mockImplementation(() => new Promise(() => {}));

    render(<AnalyticsPanel />);

    expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
  });

  it("shows error state when firestore fails", async () => {
    setupFirestoreError();

    render(<AnalyticsPanel />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /failed to load analytics/i
    );
  });

  it("does not fetch when there is no current user", () => {
    auth.currentUser = null;

    render(<AnalyticsPanel />);

    expect(getDocs).not.toHaveBeenCalled();
  });

  it("renders the analytics heading and subtitle", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    expect(await screen.findByText("Analytics")).toBeInTheDocument();
    expect(
      screen.getByText(/reports and insights for your listings/i)
    ).toBeInTheDocument();
  });

  it("renders the summary metrics", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    await screen.findByText("Analytics");

    expect(within(getMetricCard("Total applications")).getByText("4")).toBeInTheDocument();
    expect(within(getMetricCard("Accepted")).getByText("1")).toBeInTheDocument();
    expect(within(getMetricCard("Shortlisted")).getByText("1")).toBeInTheDocument();
    expect(within(getMetricCard("Placement rate")).getByText("25%")).toBeInTheDocument();
  });

  it("renders report titles", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    expect(
      await screen.findByText(/application volume per opportunity/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/placement success rate by sector/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/application trend — last 6 months/i)).toBeInTheDocument();
  });

  it("renders the CSV and PDF export buttons", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    expect(await screen.findAllByRole("button", { name: /csv/i })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: /pdf/i })).toHaveLength(3);
  });

  it("downloads CSV from report 1", async () => {
    setupSuccessfulFetch();
    const anchor = mockAnchorForDownload();

    render(<AnalyticsPanel />);

    const csvButtons = await screen.findAllByRole("button", { name: /csv/i });
    fireEvent.click(csvButtons[0]);

    expect(anchor.click).toHaveBeenCalled();
    expect(anchor.download).toBe("application_volume.csv");
    expect(anchor.href).toContain("data:text/csv;charset=utf-8");
    expect(screen.getByRole("status")).toHaveTextContent(/csv downloaded/i);
  });

  it("shows and clears the CSV toast", async () => {
    setupSuccessfulFetch();
    jest.useFakeTimers();
    const anchor = mockAnchorForDownload();

    render(<AnalyticsPanel />);

    const csvButtons = await screen.findAllByRole("button", { name: /csv/i });
    fireEvent.click(csvButtons[0]);

    expect(screen.getByRole("status")).toHaveTextContent(/csv downloaded/i);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    jest.useRealTimers();
    expect(anchor.click).toHaveBeenCalled();
  });

  it("opens the print window when PDF is clicked", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    const pdfButtons = await screen.findAllByRole("button", { name: /pdf/i });
    fireEvent.click(pdfButtons[0]);

    expect(window.open).toHaveBeenCalledWith("", "_blank");
    expect(screen.getByRole("status")).toHaveTextContent(/print dialog opened/i);
  });

  it("shows and clears the PDF toast", async () => {
    setupSuccessfulFetch();
    jest.useFakeTimers();

    render(<AnalyticsPanel />);

    const pdfButtons = await screen.findAllByRole("button", { name: /pdf/i });
    fireEvent.click(pdfButtons[0]);

    expect(screen.getByRole("status")).toHaveTextContent(/print dialog opened/i);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    jest.useRealTimers();
  });

  it("renders the sector tabs and switches between them", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    const barBtn = await screen.findByRole("button", { name: /bar/i });
    const donutBtn = screen.getByRole("button", { name: /donut/i });

    expect(barBtn).toHaveClass("analytics__tab--active");

    fireEvent.click(donutBtn);
    expect(donutBtn).toHaveClass("analytics__tab--active");

    fireEvent.click(barBtn);
    expect(barBtn).toHaveClass("analytics__tab--active");
  });

  it("renders the application status legend", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);
expect(await screen.findAllByText(/submitted/i))
  .toHaveLength(1);

expect(screen.getAllByText(/shortlisted/i)[0])
  .toBeInTheDocument();

expect(screen.getAllByText(/accepted/i)[0])
  .toBeInTheDocument();

expect(screen.getAllByText(/rejected/i)[0])
  .toBeInTheDocument();
  });

  it("renders the sector legend", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    expect(await screen.findByText(/learnership/i)).toBeInTheDocument();
    expect(screen.getByText(/internship/i)).toBeInTheDocument();
    expect(screen.getByText(/apprenticeship/i)).toBeInTheDocument();
    expect(screen.getByText(/graduate/i)).toBeInTheDocument();
  });

  it("renders three canvas elements when data exists", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    await waitFor(() => {
      expect(document.querySelectorAll("canvas")).toHaveLength(3);
    });
  });

  it("renders the trend section labels", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    expect(await screen.findByText(/applications received/i)).toBeInTheDocument();
    expect(screen.getAllByText(/accepted/i).length).toBeGreaterThan(0);
  });

  it("shows no listings state when provider has no opportunities", async () => {
    setupNoListings();

    render(<AnalyticsPanel />);

    expect(await screen.findByText(/no listings yet/i)).toBeInTheDocument();
  });

  it("does not show an alert on a successful load", async () => {
    setupSuccessfulFetch();

    render(<AnalyticsPanel />);

    await screen.findByText("Analytics");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});