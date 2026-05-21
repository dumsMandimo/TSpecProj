import "@testing-library/jest-dom";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";

import CreateProfile from "./CreateProfile";

const mockNavigate = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }) => children,
}));

jest.mock("../../firebase", () => ({
  db: {},
  auth: {
    currentUser: {
      uid: "user123",
    },
  },
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
}));

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

jest.mock("../nqfSelect", () => ({
  OTHER_QUALIFICATION_VALUE: "OTHER",

  NqfDropdown: ({ value, onChange }) => (
    <select
      data-testid="nqf-dropdown"
      value={value}
      onChange={onChange}
    >
      <option value="">
        Select NQF
      </option>

      <option value="NQF6">
        NQF6
      </option>
    </select>
  ),

  SectorDropdown: ({
    value,
    onChange,
  }) => (
    <select
      data-testid="sector-dropdown"
      value={value}
      onChange={onChange}
    >
      <option value="">
        Select Sector
      </option>

      <option value="IT">
        IT
      </option>
    </select>
  ),

  SaqaQualificationDropdown: ({
    value,
    onChange,
  }) => (
    <select
      data-testid="saqa-dropdown"
      value={value}
      onChange={(e) => {
        e.target.dataset.title =
          "Diploma in IT";

        e.target.dataset.learningSubfield =
          "Information Technology";

        e.target.dataset.sourceUrl =
          "https://example.com";

        e.target.dataset.isOther =
          "false";

        onChange(e);
      }}
    >
      <option value="">
        Select Qualification
      </option>

      <option value="QUAL123">
        Diploma in IT
      </option>

      <option value="OTHER">
        Other
      </option>
    </select>
  ),
}));

describe("CreateProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUpload.mockResolvedValue({
      data: {},
      error: null,
    });

    mockGetPublicUrl.mockReturnValue({
      data: {
        publicUrl:
          "https://supabase.co/storage/cvs/cv.pdf",
      },
    });
  });

  async function fillRequiredFields() {
    fireEvent.change(
      screen.getByPlaceholderText(
        /full name/i
      ),
      {
        target: {
          name: "name",
          value: "John Doe",
        },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        /phone number/i
      ),
      {
        target: {
          name: "phone",
          value: "0821234567",
        },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        /briefly describe your education background/i
      ),
      {
        target: {
          name: "education",
          value: "BSc IT",
        },
      }
    );

    fireEvent.change(
      screen.getByTestId(
        "nqf-dropdown"
      ),
      {
        target: {
          value: "NQF6",
        },
      }
    );

    fireEvent.change(
      screen.getByTestId(
        "sector-dropdown"
      ),
      {
        target: {
          value: "IT",
        },
      }
    );

    fireEvent.change(
      screen.getByTestId(
        "saqa-dropdown"
      ),
      {
        target: {
          value: "QUAL123",
        },
      }
    );

    const skillInput =
      screen.getByPlaceholderText(
        /excel, java, bookkeeping/i
      );

    fireEvent.change(skillInput, {
      target: {
        name: "skillInput",
        value: "JavaScript",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^add$/i,
      })
    );

    const fileInput =
      document.querySelector(
        'input[type="file"]'
      );

    const cvFile = new File(
      ["cv"],
      "cv.pdf",
      {
        type: "application/pdf",
      }
    );

    fireEvent.change(fileInput, {
      target: {
        name: "cv",
        files: [cvFile],
      },
    });
  }

  test("renders the form", () => {
    render(<CreateProfile />);

    expect(
      screen.getByText(
        /create profile/i
      )
    ).toBeInTheDocument();
  });

  test("renders all form fields", () => {
    render(<CreateProfile />);

    expect(
      screen.getByPlaceholderText(
        /full name/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        /phone number/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/education/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /practical skills/i
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(/interests/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/upload cv/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /save profile/i
      )
    ).toBeInTheDocument();
  });

  test("updates name field on change", () => {
    render(<CreateProfile />);

    const nameInput =
      screen.getByPlaceholderText(
        /full name/i
      );

    fireEvent.change(nameInput, {
      target: {
        name: "name",
        value: "John Doe",
      },
    });

    expect(nameInput.value).toBe(
      "John Doe"
    );
  });

  test("updates phone field on change", () => {
    render(<CreateProfile />);

    const phoneInput =
      screen.getByPlaceholderText(
        /phone number/i
      );

    fireEvent.change(phoneInput, {
      target: {
        name: "phone",
        value: "0821234567",
      },
    });

    expect(phoneInput.value).toBe(
      "0821234567"
    );
  });

  test("updates education textarea on change", () => {
    render(<CreateProfile />);

    const educationTextarea =
      screen.getByPlaceholderText(
        /briefly describe your education background/i
      );

    fireEvent.change(
      educationTextarea,
      {
        target: {
          name: "education",
          value:
            "BSc Computer Science",
        },
      }
    );

    expect(
      educationTextarea.value
    ).toBe(
      "BSc Computer Science"
    );
  });

  test("adds a skill", () => {
    render(<CreateProfile />);

    const skillInput =
      screen.getByPlaceholderText(
        /excel, java, bookkeeping/i
      );

    fireEvent.change(skillInput, {
      target: {
        name: "skillInput",
        value: "React",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^add$/i,
      })
    );

    expect(
      screen.getByText("React")
    ).toBeInTheDocument();
  });

  test("removes a skill", () => {
    render(<CreateProfile />);

    const skillInput =
      screen.getByPlaceholderText(
        /excel, java, bookkeeping/i
      );

    fireEvent.change(skillInput, {
      target: {
        name: "skillInput",
        value: "React",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^add$/i,
      })
    );

    expect(
      screen.getByText("React")
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByLabelText(
        /remove react/i
      )
    );

    expect(
      screen.queryByText("React")
    ).not.toBeInTheDocument();
  });

  test("does not add duplicate skills", () => {
    render(<CreateProfile />);

    const skillInput =
      screen.getByPlaceholderText(
        /excel, java, bookkeeping/i
      );

    fireEvent.change(skillInput, {
      target: {
        name: "skillInput",
        value: "React",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^add$/i,
      })
    );

    fireEvent.change(skillInput, {
      target: {
        name: "skillInput",
        value: "react",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /^add$/i,
      })
    );

    const skills =
      screen.getAllByText(/react/i);

    expect(skills.length).toBe(1);
  });

  test("adds skill when Enter key is pressed", () => {
    render(<CreateProfile />);

    const skillInput =
      screen.getByPlaceholderText(
        /excel, java, bookkeeping/i
      );

    fireEvent.change(skillInput, {
      target: {
        name: "skillInput",
        value: "Node.js",
      },
    });

    fireEvent.keyDown(skillInput, {
      key: "Enter",
      code: "Enter",
    });

    expect(
      screen.getByText("Node.js")
    ).toBeInTheDocument();
  });

  test("updates interests textarea on change", () => {
    render(<CreateProfile />);

    const interestsTextarea =
      screen
        .getAllByRole("textbox")
        .find(
          (el) =>
            el.name === "interests"
        );

    fireEvent.change(
      interestsTextarea,
      {
        target: {
          name: "interests",
          value: "Tech, Gaming",
        },
      }
    );

    expect(
      interestsTextarea.value
    ).toBe("Tech, Gaming");
  });

  test("handles file input for CV", () => {
    render(<CreateProfile />);

    const fileInput =
      document.querySelector(
        'input[type="file"]'
      );

    const file = new File(
      ["cv content"],
      "cv.pdf",
      {
        type: "application/pdf",
      }
    );

    fireEvent.change(fileInput, {
      target: {
        name: "cv",
        files: [file],
      },
    });

    expect(
      fileInput.files[0].name
    ).toBe("cv.pdf");
  });

  test("shows validation errors when required fields are missing", async () => {
    render(<CreateProfile />);

    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            /save profile/i,
        })
        .closest("form")
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /full name is required/i
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /phone number is required/i
        )
      ).toBeInTheDocument();

      expect(
        screen.getByText(
          /education is required/i
        )
      ).toBeInTheDocument();
    });
  });

  test("shows validation error for invalid phone number", async () => {
    render(<CreateProfile />);

    fireEvent.change(
      screen.getByPlaceholderText(
        /full name/i
      ),
      {
        target: {
          name: "name",
          value: "John Doe",
        },
      }
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        /phone number/i
      ),
      {
        target: {
          name: "phone",
          value: "12345",
        },
      }
    );

    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            /save profile/i,
        })
        .closest("form")
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /phone must be a valid 10-digit sa number/i
        )
      ).toBeInTheDocument();
    });
  });

  test("clears validation error after typing", async () => {
    render(<CreateProfile />);

    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            /save profile/i,
        })
        .closest("form")
    );

    expect(
      screen.getByText(
        /full name is required/i
      )
    ).toBeInTheDocument();

    const nameInput =
      screen.getByPlaceholderText(
        /full name/i
      );

    fireEvent.change(nameInput, {
      target: {
        name: "name",
        value: "John Doe",
      },
    });

    await waitFor(() => {
      expect(
        screen.queryByText(
          /full name is required/i
        )
      ).not.toBeInTheDocument();
    });
  });

  test("saves profile and navigates on submit", async () => {
    const {
      setDoc,
      doc,
      serverTimestamp,
    } = require(
      "firebase/firestore"
    );

    setDoc.mockResolvedValue();

    doc.mockReturnValue({});

    serverTimestamp.mockReturnValue(
      "timestamp"
    );

    const alertMock = jest
      .spyOn(window, "alert")
      .mockImplementation(() => {});

    render(<CreateProfile />);

    await fillRequiredFields();

    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            /save profile/i,
        })
        .closest("form")
    );

    await waitFor(() => {
      expect(
        mockUpload
      ).toHaveBeenCalled();

      expect(
        setDoc
      ).toHaveBeenCalled();

      expect(
        alertMock
      ).toHaveBeenCalledWith(
        "Profile saved successfully!"
      );

      expect(
        mockNavigate
      ).toHaveBeenCalledWith(
        "/dashboard/applicant"
      );
    });

    alertMock.mockRestore();
  });

  test("shows error when save profile fails", async () => {
    const {
      setDoc,
      doc,
      serverTimestamp,
    } = require(
      "firebase/firestore"
    );

    setDoc.mockRejectedValue(
      new Error(
        "Firestore failed"
      )
    );

    doc.mockReturnValue({});

    serverTimestamp.mockReturnValue(
      "timestamp"
    );

    const alertMock = jest
      .spyOn(window, "alert")
      .mockImplementation(() => {});

    render(<CreateProfile />);

    await fillRequiredFields();

    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            /save profile/i,
        })
        .closest("form")
    );

    await waitFor(() => {
      expect(
        alertMock
      ).toHaveBeenCalledWith(
        "Failed to save profile. Please try again."
      );
    });

    alertMock.mockRestore();
  });

  test("shows error when CV upload fails", async () => {
    mockUpload.mockResolvedValue({
      error: {
        message:
          "Upload failed",
      },
    });

    const alertMock = jest
      .spyOn(window, "alert")
      .mockImplementation(() => {});

    render(<CreateProfile />);

    await fillRequiredFields();

    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            /save profile/i,
        })
        .closest("form")
    );

    await waitFor(() => {
      expect(
        alertMock
      ).toHaveBeenCalledWith(
        "Failed to save profile. Please try again."
      );
    });

    alertMock.mockRestore();
  });

  test("shows alert when no user is logged in", async () => {
    const firebase = require(
      "../../firebase"
    );

    firebase.auth.currentUser =
      null;

    const alertMock = jest
      .spyOn(window, "alert")
      .mockImplementation(() => {});

    render(<CreateProfile />);

    fireEvent.submit(
      screen
        .getByRole("button", {
          name:
            /save profile/i,
        })
        .closest("form")
    );

    await waitFor(() => {
      expect(
        alertMock
      ).toHaveBeenCalledWith(
        "User not logged in"
      );
    });

    firebase.auth.currentUser =
      {
        uid: "user123",
      };

    alertMock.mockRestore();
  });
});