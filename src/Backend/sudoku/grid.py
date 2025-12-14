import numpy as np
from sudoku.sudokuEnums import CellValue
import itertools


class Grid:
    """
    Memory-optimized Sudoku grid.
    Uses NumPy arrays for compact, fast storage:
      - values: 9x9 uint8 (0–9)
      - types:  9x9 uint8 (enum codes)
      - pencils: 9x9 uint16 (bitmask for pencil values)
    """

    __slots__ = ('values', 'types', 'pencils')

    def __init__(self):
        self.values = np.zeros((9, 9), dtype=np.uint8)    # Cell numbers (0–9)
        self.types = np.full((9, 9), CellValue.ENTERED, dtype=np.uint8)
        self.pencils = np.zeros((9, 9), dtype=np.uint16)  # 9 bits for pencil flags

    def copy(self):
        """Creates a deep copy of the grid."""
        new_grid = Grid()
        new_grid.values = self.values.copy()
        new_grid.types = self.types.copy()
        new_grid.pencils = self.pencils.copy()
        return new_grid

    def get(self, col: int, row: int):
        """Return the value of a cell."""
        return self.values[row - 1, col - 1]

    def set(self, val: int, col: int, row: int, cell_type=None):
        """Set value and optionally type of a cell."""
        self.values[row - 1, col - 1] = val
        if cell_type is not None:
            self.types[row - 1, col - 1] = cell_type

    def set_pencil(self, set_flag: bool, val: int, col: int, row: int):
        """Set or clear a pencil value (1–9) using bitmask."""
        bit = 1 << (val - 1)
        if set_flag:
            self.pencils[row - 1, col - 1] |= bit
        else:
            self.pencils[row - 1, col - 1] &= ~bit

    def get_pencil(self, val: int, col: int, row: int) -> bool:
        """Check if a pencil mark is set."""
        return bool(self.pencils[row - 1, col - 1] & (1 << (val - 1)))

    def setup(self, cell_list: list[int]):
        """Initialize the grid from a flat list of 81 integers (0–9)."""
        arr = np.array(cell_list, dtype=np.uint8).reshape(9, 9)
        self.values[:] = arr
        self.types[arr > 0] = CellValue.STARTING

    def make_candidates(self):
        """
        Populate pencil marks (candidates) for each empty cell.
        Each pencil mask has bits 1–9 set if that value is *possible*.
        """
        ALL_PENCILS = 0x1FF  # 9 bits set (values 1–9)

        # 1️⃣ Set all empty cells to full candidates in one go
        self.pencils[:] = np.where(self.values == 0, ALL_PENCILS, 0)

        # 2️⃣ For each filled cell, remove its value from peers
        for r in range(9):
            for c in range(9):
                value = self.values[r, c]
                if value == 0:
                    continue
                bitmask = 0xFFFF ^ np.uint16(1 << (value - 1))  # XOR to flip the bit

                # Row and column elimination (vectorized)
                self.pencils[r, :] &= bitmask
                self.pencils[:, c] &= bitmask

                # Box elimination (vectorized)
                br = (r // 3) * 3
                bc = (c // 3) * 3
                self.pencils[br:br+3, bc:bc+3] &= bitmask

    #######################################################################################################
    #                   SOLVING
    #######################################################################################################

    def find_next_step(self):
        """
        Tries solving techniques in order of difficulty.
        Returns a tuple: (Technique Name, Explanation, Boolean Matrix of affected cells)
        or None if no step is found.
        """
        # 1. Helper to detect changes
        def get_diff_matrix(p_before, v_before):
            v_diff = self.values != v_before
            if np.any(v_diff):
                return v_diff.tolist()

            # 2. Fallback to Pencil Changes (Elimination Techniques)
            # If no value was set, highlight cells where candidates were removed.
            p_diff = self.pencils != p_before
            return p_diff.tolist()

        # 2. List of techniques (Name, Function, Explanation Template)
        # Note: We prioritize simpler techniques.
        techniques = [
            ("Naked Single", self.solve_naked_singles, "Only one number is possible in this cell."),
            ("Hidden Single", self.solve_hidden_singles, "This number appears only once in this row, column, or box."),
            ("Pointing Pairs", self.solve_pointing_pairs, "A candidate is restricted to a line within a box, eliminating it from the rest of the line."),
            ("Box/Line Reduction", self.solve_claiming, "A candidate is restricted to a box within a line, eliminating it from the rest of the box."),
            ("Naked Pair", lambda l: self.solve_naked_sets(2, l), "Two cells share the same two candidates, eliminating them from other cells in the unit."),
            ("Naked Triplet", lambda l: self.solve_naked_sets(3, l), "Three cells share the same three candidates, eliminating them from other cells."),
            ("Hidden Pair", lambda l: self.solve_hidden_sets(2, l), "Two candidates appear only in the same two cells in this unit."),
            ("Hidden Triplet", lambda l: self.solve_hidden_sets(3, l), "Three candidates appear only in the same three cells in this unit."),
            ("X-Wing", self.solve_xwing, "A candidate appears in exactly two positions in two rows/columns that align, forming a rectangle."),
            ("Swordfish", self.solve_swordfish, "A candidate appears in a 3x3 pattern of aligned rows/columns."),
            ("XY-Wing", self.solve_xy_wing, "Three cells form a bent connection that eliminates a common candidate."),
            ("XYZ-Wing", self.solve_xyz_wing, "Three cells form a connection that eliminates a common candidate."),
            ("Unique Rectangle", self.solve_unique_rectangles, "This pattern would lead to two solutions, so we can eliminate a candidate to avoid it."),
            ("X-Chain", self.solve_x_chains, "A chain of links proves that a candidate must be false in the highlighted cells."),
            ("Forcing Chain", self.solve_forcing_chains, "Testing this candidate leads to a contradiction.")
        ]

        # 3. Try each technique
        for title, func, explanation in techniques:
            # Snapshot state
            p_before = self.pencils.copy()
            v_before = self.values.copy()

            # Run technique with limit=1
            try:
                if func.__code__.co_argcount >= 2: # checks if func accepts args
                     changed = func(limit=1)
                else: 
                     # Handle lambdas or wrappers if needed, 
                     # but here we defined lambdas to take 'l'
                     changed = func(1)
            except TypeError:
                # Fallback for methods that might not accept limit yet (safety)
                changed = func()

            if changed > 0:
                return {
                    "title": title,
                    "explanation": explanation,
                    "matrix": get_diff_matrix(p_before, v_before)
                }
        
        return None


    def solve_naked_singles(self, limit=0):
        changed = 0
        single_mask = (self.pencils != 0) & ((self.pencils & (self.pencils - 1)) == 0)
        single_indices = np.argwhere(single_mask)

        for r, c in single_indices:
            bit = self.pencils[r, c]
            if bit == 0: continue
            
            value = int(np.log2(bit)) + 1
            self.values[r, c] = value
            self.types[r, c] = 1
            self.pencils[r, c] = 0
            changed += 1

            bitmask = 0xFFFF ^ np.uint16(1 << (value - 1))
            self.pencils[r, :] &= bitmask
            self.pencils[:, c] &= bitmask
            br, bc = (r // 3) * 3, (c // 3) * 3
            self.pencils[br:br+3, bc:bc+3] &= bitmask

            if limit > 0 and changed >= limit: return changed

        return changed

    def solve_hidden_singles(self, limit=0):
        changed = 0
        ALL_BITS = [1 << i for i in range(9)]

        for val_bit, val in zip(ALL_BITS, range(1, 10)):
            # Rows, Cols, Boxes loops...
            # We bundle the search logic to allow easy breaking
            units = []
            units.extend([('row', r) for r in range(9)])
            units.extend([('col', c) for c in range(9)])
            units.extend([('box', b) for b in range(9)])
            
            for unit_type, idx in units:
                mask = None
                if unit_type == 'row':
                    mask = (self.pencils[idx, :] & val_bit) > 0
                elif unit_type == 'col':
                    mask = (self.pencils[:, idx] & val_bit) > 0
                else: # box
                    br, bc = (idx // 3) * 3, (idx % 3) * 3
                    box = self.pencils[br:br+3, bc:bc+3]
                    mask = (box & val_bit) > 0

                if np.sum(mask) == 1:
                    # Find coordinates
                    r, c = -1, -1
                    if unit_type == 'row':
                        c = np.argmax(mask)
                        r = idx
                    elif unit_type == 'col':
                        r = np.argmax(mask)
                        c = idx
                    else: # box
                        flat_idx = np.argwhere(mask)[0]
                        br, bc = (idx // 3) * 3, (idx % 3) * 3
                        r, c = br + flat_idx[0], bc + flat_idx[1]

                    if self.values[r, c] == 0:
                        self.values[r, c] = val
                        self.types[r, c] = 1
                        self.pencils[r, c] = 0
                        changed += 1

                        # Clean peers
                        bitmask = 0xFFFF ^ np.uint16(1 << (val - 1))
                        self.pencils[r, :] &= bitmask
                        self.pencils[:, c] &= bitmask
                        br2, bc2 = (r // 3) * 3, (c // 3) * 3
                        self.pencils[br2:br2+3, bc2:bc2+3] &= bitmask

                        if limit > 0 and changed >= limit: return changed

        return changed

    def solve_hidden_sets(self, size=2, limit=0):
        changed = 0
        digits = range(1, 10)

        def process_unit(unit_coords):
            nonlocal changed
            masks = np.array([self.pencils[r, c] for r, c in unit_coords])
            if not np.any(masks): return False

            positions = {d: {i for i, m in enumerate(masks) if m & (1 << (d - 1))} for d in digits}

            for combo in itertools.combinations(digits, size):
                combined_cells = set.union(*(positions[d] for d in combo))
                if len(combined_cells) == size:
                    keep_mask = sum(1 << (d - 1) for d in combo)
                    unit_changed = False
                    for idx in combined_cells:
                        r, c = unit_coords[idx]
                        before = self.pencils[r, c]
                        new_mask = before & keep_mask
                        if new_mask != before:
                            self.pencils[r, c] = new_mask
                            changed += 1
                            unit_changed = True
                    if unit_changed: return True # Signal change found
            return False

        # Iterate all units
        all_units = []
        for r in range(9): all_units.append([(r, c) for c in range(9)])
        for c in range(9): all_units.append([(r, c) for r in range(9)])
        for br in range(0, 9, 3):
            for bc in range(0, 9, 3):
                all_units.append([(br + r, bc + c) for r in range(3) for c in range(3)])

        for unit in all_units:
            if process_unit(unit):
                if limit > 0 and changed >= limit: return changed

        return changed

    def solve_naked_sets(self, size=2, limit=0):
        changed = 0

        def process_unit(unit_coords):
            nonlocal changed
            masks = np.array([self.pencils[r, c] for r, c in unit_coords])
            nonempty = np.nonzero(masks)[0]
            if len(nonempty) < size: return False
            
            masks = masks[nonempty]
            coords = [unit_coords[i] for i in nonempty]

            for combo_idx in itertools.combinations(range(len(masks)), size):
                combo_masks = masks[list(combo_idx)]
                combined_mask = np.bitwise_or.reduce(combo_masks)
                
                if bin(combined_mask).count("1") == size:
                    if not np.all((combo_masks | combined_mask) == combined_mask):
                        continue

                    unit_changed = False
                    for i, (r, c) in enumerate(coords):
                        if i in combo_idx: continue
                        before = self.pencils[r, c]
                        new_mask = before & ~combined_mask
                        if new_mask != before:
                            self.pencils[r, c] = new_mask
                            changed += 1
                            unit_changed = True
                    if unit_changed: return True
            return False

        all_units = []
        for r in range(9): all_units.append([(r, c) for c in range(9)])
        for c in range(9): all_units.append([(r, c) for r in range(9)])
        for br in range(0, 9, 3):
            for bc in range(0, 9, 3):
                all_units.append([(br + r, bc + c) for r in range(3) for c in range(3)])

        for unit in all_units:
            if process_unit(unit):
                if limit > 0 and changed >= limit: return changed

        return changed

    def solve_pointing_pairs(self, limit=0):
        changed = 0

        for val in range(1, 10):
            val_bit = np.uint16(1 << (val - 1))
            not_val_bit = 0xFFFF ^ val_bit

            for br in range(0, 9, 3):
                for bc in range(0, 9, 3):
                    box_cells = []
                    for r in range(br, br + 3):
                        for c in range(bc, bc + 3):
                            if self.pencils[r, c] & val_bit:
                                box_cells.append((r, c))

                    if not box_cells: continue

                    local_changed = False
                    
                    # Row Check
                    rows = {r for r, c in box_cells}
                    if len(rows) == 1:
                        row = rows.pop()
                        for c in range(9):
                            if bc <= c < bc + 3: continue
                            if self.pencils[row, c] & val_bit:
                                self.pencils[row, c] &= not_val_bit
                                changed += 1
                                local_changed = True
                    
                    if local_changed and limit > 0 and changed >= limit: return changed

                    # Col Check
                    cols = {c for r, c in box_cells}
                    if len(cols) == 1:
                        col = cols.pop()
                        for r in range(9):
                            if br <= r < br + 3: continue
                            if self.pencils[r, col] & val_bit:
                                self.pencils[r, col] &= not_val_bit
                                changed += 1
                                local_changed = True
                                
                    if local_changed and limit > 0 and changed >= limit: return changed

        return changed

    def solve_claiming(self, limit=0):
        changed = 0
        for val in range(1, 10):
            val_bit = np.uint16(1 << (val - 1))
            not_val_bit = 0xFFFF ^ val_bit

            # Rows
            for r in range(9):
                cols_with = [c for c in range(9) if self.pencils[r, c] & val_bit]
                if not cols_with: continue
                
                box_cols = {c // 3 for c in cols_with}
                if len(box_cols) == 1:
                    bc = box_cols.pop() * 3
                    br = (r // 3) * 3
                    local_changed = False
                    for box_r in range(br, br + 3):
                        if box_r == r: continue
                        for box_c in range(bc, bc + 3):
                            if self.pencils[box_r, box_c] & val_bit:
                                self.pencils[box_r, box_c] &= not_val_bit
                                changed += 1
                                local_changed = True
                    if local_changed and limit > 0 and changed >= limit: return changed

            # Cols
            for c in range(9):
                rows_with = [r for r in range(9) if self.pencils[r, c] & val_bit]
                if not rows_with: continue
                
                box_rows = {r // 3 for r in rows_with}
                if len(box_rows) == 1:
                    br = box_rows.pop() * 3
                    bc = (c // 3) * 3
                    local_changed = False
                    for box_r in range(br, br + 3):
                        for box_c in range(bc, bc + 3):
                            if box_c == c: continue
                            if self.pencils[box_r, box_c] & val_bit:
                                self.pencils[box_r, box_c] &= not_val_bit
                                changed += 1
                                local_changed = True
                    if local_changed and limit > 0 and changed >= limit: return changed

        return changed

    def solve_fish(self, size=2, limit=0):
        changed = 0
        for val in range(1, 10):
            val_bit = 1 << (val - 1)
            
            # Row Fish
            rows_with = []
            row_cols = {}
            for r in range(9):
                cols = {c for c in range(9) if self.pencils[r, c] & val_bit}
                if 2 <= len(cols) <= size:
                    rows_with.append(r)
                    row_cols[r] = cols

            if len(rows_with) >= size:
                for row_combo in itertools.combinations(rows_with, size):
                    all_cols = set.union(*(row_cols[r] for r in row_combo))
                    if len(all_cols) == size:
                        local_changed = False
                        for r in range(9):
                            if r in row_combo: continue
                            for c in all_cols:
                                if self.pencils[r, c] & val_bit:
                                    self.pencils[r, c] &= ~val_bit
                                    changed += 1
                                    local_changed = True
                        if local_changed and limit > 0 and changed >= limit: return changed

            # Col Fish
            cols_with = []
            col_rows = {}
            for c in range(9):
                rows = {r for r in range(9) if self.pencils[r, c] & val_bit}
                if 2 <= len(rows) <= size:
                    cols_with.append(c)
                    col_rows[c] = rows

            if len(cols_with) >= size:
                for col_combo in itertools.combinations(cols_with, size):
                    all_rows = set.union(*(col_rows[c] for c in col_combo))
                    if len(all_rows) == size:
                        local_changed = False
                        for c in range(9):
                            if c in col_combo: continue
                            for r in all_rows:
                                if self.pencils[r, c] & val_bit:
                                    self.pencils[r, c] &= ~val_bit
                                    changed += 1
                                    local_changed = True
                        if local_changed and limit > 0 and changed >= limit: return changed
        return changed

    def solve_xwing(self, limit=0):
        return self.solve_fish(size=2, limit=limit)

    def solve_swordfish(self, limit=0):
        return self.solve_fish(size=3, limit=limit)

    def solve_xy_wing(self, limit=0):
        changed = 0
        bi_value_cells = []
        for r in range(9):
            for c in range(9):
                mask = self.pencils[r, c]
                if mask and bin(mask).count('1') == 2:
                    candidates = [i + 1 for i in range(9) if mask & (1 << i)]
                    bi_value_cells.append((r, c, candidates[0], candidates[1]))

        for pivot_r, pivot_c, x, y in bi_value_cells:
            xz_wings = []
            yz_wings = []
            for wing_r, wing_c, a, b in bi_value_cells:
                if (wing_r, wing_c) == (pivot_r, pivot_c): continue
                if not self._cells_see_each_other(pivot_r, pivot_c, wing_r, wing_c): continue
                if x in (a, b) and y not in (a, b):
                    z = a if a != x else b
                    xz_wings.append((wing_r, wing_c, z))
                if y in (a, b) and x not in (a, b):
                    z = a if a != y else b
                    yz_wings.append((wing_r, wing_c, z))

            for xz_r, xz_c, z1 in xz_wings:
                for yz_r, yz_c, z2 in yz_wings:
                    if z1 != z2: continue
                    z = z1
                    z_bit = 1 << (z - 1)
                    local_changed = False
                    for r in range(9):
                        for c in range(9):
                            if (r, c) in [(pivot_r, pivot_c), (xz_r, xz_c), (yz_r, yz_c)]: continue
                            if not (self.pencils[r, c] & z_bit): continue
                            if (self._cells_see_each_other(r, c, xz_r, xz_c) and
                                self._cells_see_each_other(r, c, yz_r, yz_c)):
                                self.pencils[r, c] &= ~z_bit
                                changed += 1
                                local_changed = True
                    if local_changed and limit > 0 and changed >= limit: return changed
        return changed

    def solve_xyz_wing(self, limit=0):
        changed = 0
        tri_cells = []
        bi_cells = []
        for r in range(9):
            for c in range(9):
                mask = self.pencils[r, c]
                if not mask: continue
                cnt = bin(mask).count('1')
                cands = [i + 1 for i in range(9) if mask & (1 << i)]
                if cnt == 3: tri_cells.append((r, c, cands[0], cands[1], cands[2]))
                elif cnt == 2: bi_cells.append((r, c, cands[0], cands[1]))

        for pivot_r, pivot_c, x, y, z in tri_cells:
            xz_wings = [ (wr, wc) for wr, wc, a, b in bi_cells if set([a,b]) == set([x,z]) and self._cells_see_each_other(pivot_r, pivot_c, wr, wc)]
            yz_wings = [ (wr, wc) for wr, wc, a, b in bi_cells if set([a,b]) == set([y,z]) and self._cells_see_each_other(pivot_r, pivot_c, wr, wc)]

            for xz_r, xz_c in xz_wings:
                for yz_r, yz_c in yz_wings:
                    z_bit = 1 << (z - 1)
                    local_changed = False
                    for r in range(9):
                        for c in range(9):
                            if (r, c) in [(pivot_r, pivot_c), (xz_r, xz_c), (yz_r, yz_c)]: continue
                            if not (self.pencils[r, c] & z_bit): continue
                            if (self._cells_see_each_other(r, c, pivot_r, pivot_c) and
                                self._cells_see_each_other(r, c, xz_r, xz_c) and
                                self._cells_see_each_other(r, c, yz_r, yz_c)):
                                self.pencils[r, c] &= ~z_bit
                                changed += 1
                                local_changed = True
                    if local_changed and limit > 0 and changed >= limit: return changed
        return changed

    def solve_unique_rectangles(self, limit=0):
        changed = 0
        bi_value_cells = {}
        for r in range(9):
            for c in range(9):
                if self.types[r, c] == CellValue.STARTING: continue
                mask = self.pencils[r, c]
                if mask and bin(mask).count('1') == 2:
                    cands = tuple(sorted([i + 1 for i in range(9) if mask & (1 << i)]))
                    if cands not in bi_value_cells: bi_value_cells[cands] = []
                    bi_value_cells[cands].append((r, c))

        for (x, y), cells in bi_value_cells.items():
            if len(cells) < 3: continue
            for i, (r1, c1) in enumerate(cells):
                for j, (r2, c2) in enumerate(cells[i + 1:], i + 1):
                    if r1 == r2 or c1 == c2: continue
                    if (r1 // 3 == r2 // 3) and (c1 // 3 == c2 // 3): continue
                    
                    r3, c3 = r1, c2
                    r4, c4 = r2, c1
                    if (self.types[r3, c3] == CellValue.STARTING or self.types[r4, c4] == CellValue.STARTING): continue

                    mask3, mask4 = self.pencils[r3, c3], self.pencils[r4, c4]
                    if not mask3 or not mask4: continue

                    xy_mask = (1 << (x - 1)) | (1 << (y - 1))
                    local_changed = False

                    # Type 1
                    if mask4 == xy_mask and (mask3 & xy_mask) == xy_mask and mask3 != xy_mask:
                        self.pencils[r3, c3] &= ~xy_mask
                        changed += 1
                        local_changed = True
                    elif mask3 == xy_mask and (mask4 & xy_mask) == xy_mask and mask4 != xy_mask:
                        self.pencils[r4, c4] &= ~xy_mask
                        changed += 1
                        local_changed = True
                    
                    if local_changed and limit > 0 and changed >= limit: return changed

                    # Type 2
                    if (mask3 & xy_mask) == xy_mask and (mask4 & xy_mask) == xy_mask:
                        extra3 = mask3 & ~xy_mask
                        extra4 = mask4 & ~xy_mask
                        if extra3 and extra3 == extra4:
                            for r in range(9):
                                for c in range(9):
                                    if (r, c) in [(r1, c1), (r2, c2), (r3, c3), (r4, c4)]: continue
                                    if not self.pencils[r, c]: continue
                                    if (self._cells_see_each_other(r, c, r3, c3) and
                                        self._cells_see_each_other(r, c, r4, c4)):
                                        before = self.pencils[r, c]
                                        self.pencils[r, c] &= ~extra3
                                        if self.pencils[r, c] != before:
                                            changed += 1
                                            local_changed = True
                    
                    if local_changed and limit > 0 and changed >= limit: return changed
        return changed

    def solve_x_chains(self, limit=0):
        changed = 0
        for val in range(1, 10):
            val_bit = 1 << (val - 1)
            strong_links = set()
            
            # Find strong links
            for r in range(9):
                pos = [(r, c) for c in range(9) if self.pencils[r, c] & val_bit]
                if len(pos) == 2: strong_links.add(tuple(sorted(pos)))
            for c in range(9):
                pos = [(r, c) for r in range(9) if self.pencils[r, c] & val_bit]
                if len(pos) == 2: strong_links.add(tuple(sorted(pos)))
            for br in range(0, 9, 3):
                for bc in range(0, 9, 3):
                    pos = [(r, c) for r in range(br, br + 3) for c in range(bc, bc + 3) if self.pencils[r, c] & val_bit]
                    if len(pos) == 2: strong_links.add(tuple(sorted(pos)))

            if not strong_links: continue

            adj = {}
            for c1, c2 in strong_links:
                adj.setdefault(c1, []).append(c2)
                adj.setdefault(c2, []).append(c1)

            colored = {}
            for start in adj:
                if start in colored: continue
                q = [start]
                colored[start] = 0
                while q:
                    u = q.pop(0)
                    nc = 1 - colored[u]
                    for v in adj.get(u, []):
                        if v not in colored:
                            colored[v] = nc
                            q.append(v)
            
            color_groups = {0: [], 1: []}
            for cell, clr in colored.items(): color_groups[clr].append(cell)

            local_changed = False

            # Rule 2: cell sees both colors
            for r in range(9):
                for c in range(9):
                    if (r, c) in colored: continue
                    if not (self.pencils[r, c] & val_bit): continue
                    sees = [False, False]
                    for clr in [0, 1]:
                        for cr, cc in color_groups[clr]:
                            if self._cells_see_each_other(r, c, cr, cc):
                                sees[clr] = True
                                break
                    if sees[0] and sees[1]:
                        self.pencils[r, c] &= ~val_bit
                        changed += 1
                        local_changed = True
            
            if local_changed and limit > 0 and changed >= limit: return changed
        return changed

    def solve_forcing_chains(self, limit=0):
        # Simplification: treat as bulk op for now or implement deeper check.
        # Given complexity, we'll just check limit on return.
        changed = 0
        MAX_DEPTH = 3
        for r in range(9):
            for c in range(9):
                mask = self.pencils[r, c]
                if not mask: continue
                cands = [i+1 for i in range(9) if mask & (1<<i)]
                if len(cands) not in [2, 3]: continue
                
                common = None
                for val in cands:
                    tg = self._copy_state()
                    tg[r, c] = (1 << (val - 1))
                    elim = self._propagate_simple(tg, MAX_DEPTH)
                    if elim is None: # Contradiction
                        if self.pencils[r, c] & (1 << (val - 1)):
                            self.pencils[r, c] &= ~(1 << (val - 1))
                            changed += 1
                            if limit > 0 and changed >= limit: return changed
                        break 
                    
                    if common is None: common = elim.copy()
                    else: common = {k: v for k, v in common.items() if k in elim and elim[k] == v}
                
                if common:
                    for (tr, tc), tmask in common.items():
                        if self.pencils[tr, tc] != tmask:
                            self.pencils[tr, tc] = tmask
                            changed += 1
                            if limit > 0 and changed >= limit: return changed
        return changed


    def _copy_state(self):
        """Create a copy of the current pencil marks."""
        return self.pencils.copy()


    def _propagate_simple(self, test_pencils, max_steps=3):
        """
        Propagate constraints on test grid for a limited number of steps.
        Returns dict of cell positions to their resulting pencil masks,
        or None if contradiction found.
        """
        original_pencils = self.pencils
        self.pencils = test_pencils
        
        try:
            for _ in range(max_steps):
                # Apply naked singles
                single_mask = (self.pencils != 0) & ((self.pencils & (self.pencils - 1)) == 0)
                single_indices = np.argwhere(single_mask)
                
                if len(single_indices) == 0:
                    break
                
                for r, c in single_indices:
                    bit = self.pencils[r, c]
                    if bit == 0:
                        continue
                    value = int(np.log2(bit)) + 1
                    
                    # Check for contradictions
                    bitmask = 0xFFFF ^ np.uint16(1 << (value - 1))
                    
                    # Check row
                    if np.any((self.pencils[r, :] & (1 << (value - 1))) & 
                             (self.pencils[r, :] != bit)):
                        # Would eliminate all candidates from a cell
                        for check_c in range(9):
                            if check_c != c and self.pencils[r, check_c] == bit:
                                self.pencils = original_pencils
                                return None
                    
                    self.pencils[r, c] = 0
                    self.pencils[r, :] &= bitmask
                    self.pencils[:, c] &= bitmask
                    br, bc = (r // 3) * 3, (c // 3) * 3
                    self.pencils[br:br+3, bc:bc+3] &= bitmask
                    
                    # Check for cells with no candidates (contradiction)
                    if np.any((self.pencils == 0) & (original_pencils != 0)):
                        self.pencils = original_pencils
                        return None
            
            result = {(r, c): self.pencils[r, c] 
                     for r in range(9) for c in range(9) 
                     if self.pencils[r, c] != original_pencils[r, c]}
            
            self.pencils = original_pencils
            return result
            
        except Exception:
            self.pencils = original_pencils
            return None
    
    #######################################################################################################
    #                   STRING
    #######################################################################################################

    def __str__(self):
        border = '+' + '-' * 53 + '+\n'
        text = border
        for r in range(9):
            for j in range(3):
                text += '|'
                for c in range(9):
                    if self.types[r, c] == CellValue.PENCIL:
                        line = ''.join(
                            str(i) if self.get_pencil(i, c + 1, r + 1) else '.'
                            for i in range(1 + j * 3, 4 + j * 3)
                        )
                        text += ' '.join(line)
                    else:
                        text += f"  {self.values[r, c]}  " if j == 1 else "     "
                    text += '|'
                text += '\n'
            text += border
        return text
    
    def to_dict(self):
        """
        Convert grid to dictionary for JSON serialization.
        Returns a dict with values, types, and pencil marks.
        """
        # Convert values and types to lists
        values_list = self.values.tolist()
        types_list = self.types.tolist()
        
        # Convert pencil marks to list of candidates for each cell
        pencils_list = []
        for r in range(9):
            row = []
            for c in range(9):
                mask = self.pencils[r, c]
                if mask == 0:
                    row.append([])
                else:
                    # Extract all set bits as candidate numbers
                    candidates = [i + 1 for i in range(9) if mask & (1 << i)]
                    row.append(candidates)
            pencils_list.append(row)
        
        return {
            'values': values_list,
            'types': types_list,
            'pencils': pencils_list
        }
    
    def update_from_dict(self, data):
        # Restore numpy arrays for values and types
        self.values = np.array(data['values'])
        self.types = np.array(data['types'])

        # Reconstruct pencil marks from candidate lists
        pencils_array = np.zeros((9, 9), dtype=np.uint16)
        for r in range(9):
            for c in range(9):
                candidates = data['pencils'][r][c]
                mask = 0
                for n in candidates:
                    mask |= (1 << (n - 1))
                pencils_array[r, c] = mask

        self.pencils = pencils_array
    
    
    @classmethod
    def from_dict(cls, data):
        """
        Reconstruct grid from dictionary created by to_dict().
        Expects a dict with 'values', 'types', and 'pencils'.
        """

        # Create an empty instance (assuming __init__ sets up arrays)
        obj = cls.__new__(cls)

        # Restore numpy arrays for values and types
        obj.values = np.array(data['values'])
        obj.types = np.array(data['types'])

        # Reconstruct pencil marks from candidate lists
        pencils_array = np.zeros((9, 9), dtype=np.uint16)
        for r in range(9):
            for c in range(9):
                candidates = data['pencils'][r][c]
                mask = 0
                for n in candidates:
                    mask |= (1 << (n - 1))
                pencils_array[r, c] = mask

        obj.pencils = pencils_array

        return obj

                